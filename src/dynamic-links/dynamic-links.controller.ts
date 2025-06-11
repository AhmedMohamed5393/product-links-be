import { Body, Controller, Get, Headers, Param, Post, Query, Res } from "@nestjs/common";
import { CreateLinkDto } from "./dtos/create-link.dto";
import { DynamicLinksService } from "./dynamic-links.service";
import { SuccessClass } from "src/shared/classes/success.class";
import { ApiOperation, ApiBody, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { Response } from "express";

@Controller('dynamic_links')
export class DynamicLinksController {
  constructor(private readonly service: DynamicLinksService) {}

  @ApiOperation({ summary: 'Generate a short dynamic link' })
  @ApiBody({ type: CreateLinkDto })
  @ApiResponse({ status: 201, description: 'Link is generated successfully' })
  @Post('generate')
  public async createLink(@Body() dto: CreateLinkDto) {
    const url = await this.service.generateLink(dto);
    return new SuccessClass({ url }, 'Link is generated successfully');
  }

  @ApiOperation({ summary: 'Resolve a short link and redirect' })
  @ApiParam({ name: 'code', type: String, required: true })
  @ApiQuery({ name: 'd', type: String, required: false })
  @ApiQuery({ name: 'json', type: String, required: false })
  @ApiResponse({ status: 302, description: 'Redirects to the original long URL' })
  @Get(':code')
  public async redirect(
    @Headers('user-agent') userAgent: string,
    @Res() res: Response,
    @Param('code') code: string,
    @Query('json') json: string, // json refers to the response format
    @Query('d') debug?: string,
  ) {
    const data = await this.service.resolve(code, debug, userAgent, json);
    
    if (debug === '1' && json === '1') {
      return res.json(new SuccessClass(data, 'Link is resolved successfully'));
    }

    return res.redirect(data);
  }
}
