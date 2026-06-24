class DomainException(Exception):
    pass


class NotFoundError(DomainException):
    pass


class AuthError(DomainException):
    pass


class StorageError(DomainException):
    pass
