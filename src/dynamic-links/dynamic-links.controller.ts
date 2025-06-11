import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { CreateLinkDto } from "./dtos/create-link.dto";
import { DynamicLinksService } from "./dynamic-links.service";
import { SuccessClass } from "src/shared/classes/success.class";
import { ApiOperation, ApiBody, ApiResponse, ApiParam } from "@nestjs/swagger";
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
  @ApiParam({ name: 'code', type: String })
  @ApiResponse({ status: 302, description: 'Redirects to the original long URL' })
  @Get(':code')
  public async redirect(
    @Param('code') code: string,
    @Query('d') debug: string,
    @Res() res: Response,
  ) {
    const data = await this.service.resolve(code, debug);
    if (debug != '1') {
      return res.status(302).redirect(data);
    }

    return new SuccessClass(data, 'Link is resolved successfully');
  }
}
