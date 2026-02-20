class TTSException(Exception):
    pass


class URLFetchException(TTSException):
    pass


class ContentExtractionException(TTSException):
    pass


class ModelInferenceException(TTSException):
    pass


class AudioProcessingException(TTSException):
    pass


class FileStorageException(TTSException):
    pass
