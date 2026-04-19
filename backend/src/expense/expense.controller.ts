import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/JWT/jwt-auth.guard';

@Controller('expenses') // ✅ Changé de 'expense' à 'expenses' pour correspondre à ton log mobile
@UseGuards(JwtAuthGuard) // On protège toutes les routes pour avoir accès à req.user
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    // On passe l'ID de l'utilisateur connecté au service
    const created = await this.expenseService.create(
      createExpenseDto,
      req.user.id,
    );
    // On retourne la dépense créée
    return this.expenseService.findOne(created.id, req.user.id);
  }

  // ✅ CETTE ROUTE ÉTAIT CELLE QUI MANQUAIT (404)
  @Get('me') // On définit explicitement la route /me demandée par le mobile
  findAll(@Request() req) {
    // On ne récupère que les dépenses de l'utilisateur extrait du Token JWT
    return this.expenseService.findByUser(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    // Récupération d'une dépense spécifique par son ID et celui de l'utilisateur
    return this.expenseService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req,
  ) {
    // On vérifie d'abord que la dépense appartient bien à l'utilisateur
    await this.expenseService.findOne(+id, req.user.id);

    // Mise à jour de la dépense
    return this.expenseService.update(+id, req.user.id, updateExpenseDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    // On vérifie l'appartenance avant de supprimer
    await this.expenseService.findOne(+id, req.user.id);

    // Suppression de la dépense
    return this.expenseService.remove(+id, req.user.id);
  }
}
