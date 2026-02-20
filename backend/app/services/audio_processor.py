import numpy as np
import soundfile as sf
from pydub import AudioSegment
import io
import os
import uuid
from pathlib import Path
import logging
from typing import List, Tuple

from app.core.config import settings
from app.core.exceptions import AudioProcessingException

logger = logging.getLogger(__name__)


class AudioProcessor:
    def __init__(self):
        self.temp_dir = Path(settings.TEMP_AUDIO_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def merge_audio_segments(self, segments: List[Tuple]) -> Tuple:
        if not segments:
            raise AudioProcessingException("No audio segments to merge")

        sample_rate = segments[0][1]
        combined = np.concatenate([seg[0] for seg in segments])
        logger.info(
            f"Merged {len(segments)} audio segments, total length: {len(combined)}"
        )

        return (combined, sample_rate)

    def save_audio(self, audio: tuple, output_path: str, format: str = "mp3"):
        try:
            data, sample_rate = audio

            if format == "wav":
                sf.write(output_path, data, sample_rate)
            elif format == "mp3":
                with io.BytesIO() as wav_buffer:
                    sf.write(wav_buffer, data, sample_rate, format="WAV")
                    wav_buffer.seek(0)

                    audio_segment = AudioSegment.from_wav(wav_buffer)
                    audio_segment.export(output_path, format="mp3", bitrate="192k")
            else:
                raise AudioProcessingException(f"Unsupported format: {format}")

            logger.info(f"Audio saved to: {output_path}")

        except Exception as e:
            logger.error(f"Failed to save audio: {e}")
            raise AudioProcessingException(f"Failed to save audio: {str(e)}")

    def get_duration(self, audio: tuple) -> float:
        data, sample_rate = audio
        return len(data) / sample_rate

    def generate_audio_id(self) -> str:
        return str(uuid.uuid4())

    def get_temp_path(self, audio_id: str, format: str = "mp3") -> str:
        return str(self.temp_dir / f"{audio_id}.{format}")

    def file_exists(self, audio_id: str, format: str = "mp3") -> bool:
        path = self.get_temp_path(audio_id, format)
        return os.path.exists(path)

    def delete_file(self, audio_id: str, format: str = "mp3"):
        try:
            path = self.get_temp_path(audio_id, format)
            if os.path.exists(path):
                os.remove(path)
                logger.info(f"Deleted audio file: {path}")
        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
