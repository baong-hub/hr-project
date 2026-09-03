using System.Collections.Generic;
using MediatR;

namespace HR.Application.Auth.Queries.GetAuthorizedMenus;

public record GetAuthorizedMenusQuery() : IRequest<IEnumerable<MenuDto>>;

public record MenuDto(
    int Id, 
    string Code, 
    string Name, 
    string? ShortName,
    string? Icon, 
    string? Route, 
    int SortOrder, 
    IEnumerable<MenuDto> Children);
