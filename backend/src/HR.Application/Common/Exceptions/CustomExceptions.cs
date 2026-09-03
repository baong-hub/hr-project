using System;

namespace HR.Application.Common.Exceptions;

public class ForbiddenException : Exception
{
    public string Code { get; }
    public ForbiddenException(string message) : base(message) 
    { 
        Code = "FORBIDDEN";
    }
    public ForbiddenException(string code, string message) : base(message)
    {
        Code = code;
    }
}

public class NotFoundException : Exception
{
    public string Code { get; }
    public NotFoundException(string code, string message) : base(message)
    {
        Code = code;
    }
}

public class ConflictException : Exception
{
    public string Code { get; }
    public ConflictException(string code, string message) : base(message)
    {
        Code = code;
    }
}

public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(IDictionary<string, string[]> errors) 
        : base("One or more validation failures have occurred.")
    {
        Errors = errors;
    }
}

public class BadRequestException : Exception
{
    public string Code { get; }
    public BadRequestException(string code, string message) : base(message)
    {
        Code = code;
    }
}

public class UnauthorizedException : Exception
{
    public string Code { get; }
    public UnauthorizedException(string code, string message) : base(message)
    {
        Code = code;
    }
}

