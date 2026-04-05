import { Controller, Get, Post, Body, Param, Put, Patch, Delete, Query, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all active users for a specific tenant with pagination' })
  @ApiParam({ name: 'tenantId', description: 'The UUID of the tenant' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of users' })
  async getAllUsers(
    @Param('tenantId') tenantId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.usersService.getAllUsers(tenantId, skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('phone/:tenantId/:phone')
  @ApiOperation({ summary: 'Get user by phone number within a tenant context' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getUserByPhone(
    @Param('tenantId') tenantId: string,
    @Param('phone') phone: string,
  ) {
    return this.usersService.findByPhone(phone, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user/customer' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User with this phone already exists in this tenant' })
  async createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Fully update a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated' })
  async patchUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deactivated successfully' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  // Customer endpoints
  @Get('customer/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current customer profile' })
  async getMyProfile(@Request() req: any) {
    const { user } = req;
    return this.usersService.findById(user.id);
  }

  @Patch('customer/profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current customer profile' })
  async updateMyProfile(@Body() dto: UpdateUserDto, @Request() req: any) {
    const { user } = req;
    return this.usersService.updateUser(user.id, dto);
  }
}
