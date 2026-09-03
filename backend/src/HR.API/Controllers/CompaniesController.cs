using System.Collections.Generic;
using System.Threading.Tasks;
using HR.Application.Common.Models;
using HR.Application.Companies.Dtos;
using HR.Application.Companies.Commands.UpdateCompany;
using HR.Application.Companies.Commands.FollowCompany;
using HR.Application.Companies.Queries.GetCompanyById;
using HR.Application.Companies.Queries.GetCompanies;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HR.Infrastructure.Security;
using HR.Application.Common.Exceptions;

namespace HR.Api.Controllers;

[ApiController]
[Route("api/v1/companies")]
[Authorize]
public class CompaniesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] GetCompaniesQuery query)
    {
        var result = await mediator.Send(query);
        return Ok(ApiResponse<PagedResult<CompanyDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await mediator.Send(new GetCompanyByIdQuery(id));
        return Ok(ApiResponse<CompanyDto>.Ok(result));
    }

    [HttpPut("{id:int}")]
    [RequirePermission("company:update")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCompanyCommand command)
    {
        if (id != command.Id)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "id", new[] { "ID không khớp." } }
            });
        }

        var result = await mediator.Send(command);
        return Ok(ApiResponse<CompanyDto>.Ok(result));
    }

    [HttpPost("{id:int}/follow")]
    [RequirePermission("job:save")]
    public async Task<IActionResult> Follow(int id)
    {
        var result = await mediator.Send(new FollowCompanyCommand(id));
        return Ok(ApiResponse<FollowResultDto>.Ok(result));
    }
}
