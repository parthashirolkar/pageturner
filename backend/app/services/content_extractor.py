import logging
import os

import httpx
import trafilatura
from dotenv import load_dotenv
from openai import OpenAI

from app.core.config import settings
from app.core.exceptions import ContentExtractionException, URLFetchException

load_dotenv()

logger = logging.getLogger(__name__)


class ContentExtractor:
    def __init__(self):
        self.timeout = httpx.Timeout(settings.HTTP_TIMEOUT, connect=5.0)

    async def fetch_url(self, url: str) -> str:
        async with httpx.AsyncClient(
            timeout=self.timeout, follow_redirects=True, verify=False
        ) as client:
            try:
                response = await client.get(
                    url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    },
                )
                response.raise_for_status()
                return response.text
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error fetching URL: {e.response.status_code}")
                raise URLFetchException(
                    f"Failed to fetch URL: HTTP {e.response.status_code}"
                )
            except httpx.RequestError as e:
                logger.error(f"Network error fetching URL: {e}")
                raise URLFetchException(f"Network error: {str(e)}")

    def extract_content(self, html: str, url: str) -> dict:
        try:
            result = trafilatura.extract(
                html,
                url=url,
                output_format="json",
                with_metadata=True,
                include_comments=False,
                include_tables=False,
                deduplicate=True,
            )

            if not result:
                result = trafilatura.extract(
                    html, output_format="json", favor_recall=True
                )

            if not result:
                raise ContentExtractionException("Could not extract content from page")

            import json

            content = json.loads(result)

            if not content.get("text"):
                raise ContentExtractionException("No text content found")

            return content

        except Exception as e:
            logger.error(f"Content extraction failed: {e}")
            raise ContentExtractionException(f"Failed to extract content: {str(e)}")

    def summarize_content(self, content: dict) -> str:
        try:
            base_url = os.getenv("BASE_URL") or os.getenv("OPENAI_API_BASE_URL", "")
            api_key = os.getenv("API_KEY") or os.getenv("OPENAI_API_KEY", "")

            if not base_url or not api_key:
                raise ValueError(
                    "BASE_URL and API_KEY environment variables must be set for summarization"
                )

            client = OpenAI(
                base_url=base_url,
                api_key=api_key,
            )

            system_prompt = """You are an expert content condenser. Your task is to aggressively compress articles while preserving only the most valuable insights."""

            user_prompt = f"""CRITICAL REQUIREMENT: Condense this article to EXACTLY 150-200 words maximum. No exceptions.

Strict rules:
- 150-200 words HARD LIMIT (do not exceed under any circumstance)
- Single paragraph only
- No bullet points, numbered lists, or headings
- Capture ONLY: main idea + 2-3 key takeaways
- Remove all fluff, examples, and elaboration
- Be ruthless with cutting - less is more
- Use conversational flow suitable for audio

If original text is 1000+ words, reduce to absolute essentials. Prioritize actionable insights over general information.

Article Title: {content.get("title", "Untitled")}

Article Content:
{content["text"]}

Create a flowing paragraph that could be comfortably narrated without interrupting the listener's experience."""

            logger.info(
                f"Requesting summary for {len(content['text'].split())} words..."
            )
            logger.info(f"Using API: {base_url[:30]}...")

            response = client.chat.completions.create(
                model="nvidia/nemotron-3-nano-30b-a3b:free",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=1000,
                temperature=0.7,
                reasoning_effort="none",
            )

            choice = response.choices[0]

            summary_text = choice.message.content or ""

            if len(summary_text) == 0:
                reasoning_text = getattr(choice.message, "reasoning", None) or ""
                if reasoning_text:
                    logger.info("Content field empty, using reasoning field")
                    summary_text = reasoning_text

            logger.info(f"Summary generated: {len(summary_text.split())} words")
            logger.info(f"Finish reason: {choice.finish_reason}")

            if len(summary_text) == 0:
                logger.error(f"API response is empty! Response: {response}")

            return summary_text

        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            raise ContentExtractionException(f"Failed to summarize content: {str(e)}")

    async def process_url(self, url: str) -> dict:
        html = await self.fetch_url(url)
        content = self.extract_content(html, url)

        text_to_process = content.get("text", "")
        title = content.get("title", "Untitled")

        if len(text_to_process) > 300:
            try:
                logger.info("Summarizing long content before TTS...")
                text_to_process = self.summarize_content(content)
                title = f"{title} (Summarized)"
                logger.info(
                    f"Content condensed from {len(content['text'].split())} to {len(text_to_process.split())} words."
                )
            except Exception as e:
                logger.warning(f"Summarization failed, using original text: {e}")

        return {
            "title": title,
            "text": text_to_process,
            "author": content.get("author"),
            "date": content.get("date"),
            "url": url,
        }
