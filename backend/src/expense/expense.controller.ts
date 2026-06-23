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

@Controller('expenses') // Mis au pluriel pour correspondre aux appels de ton application mobile
@UseGuards(JwtAuthGuard) // Protège toutes les routes et injecte req.user via le JWT
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  /**
   * Crée une nouvelle transaction (Dépense ou Revenu)
   */
  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    const created = await this.expenseService.create(
      createExpenseDto,
      req.user.id,
    );
    return this.expenseService.findOne(created.id, req.user.id);
  }

  /**
   * Récupère toutes les transactions de l'utilisateur connecté
   */
  @Get('me')
  findAll(@Request() req) {
    return this.expenseService.findByUser(req.user.id);
  }

  /**
   * Récupère les statistiques comparatives (Mois actuel vs Mois précédent)
   */
  @Get('comparison')
  async getComparison(@Request() req) {
    return this.expenseService.getComparisonStats(req.user.id);
  }

  /**
   * Récupère le détail d'une transaction spécifique
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.expenseService.findOne(+id, req.user.id);
  }

  /**
   * Modifie une transaction existante
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req,
  ) {
    // Vérification de sécurité : s'assurer que la ressource appartient bien à l'utilisateur
    await this.expenseService.findOne(+id, req.user.id);
    return this.expenseService.update(+id, req.user.id, updateExpenseDto);
  }

  /**
   * Supprime définitivement une transaction
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    // Vérification de sécurité : s'assurer que la ressource appartient bien à l'utilisateur
    await this.expenseService.findOne(+id, req.user.id);

    // ✅ RETOUR DE LA SUPPRESSION : Essentiel pour libérer la promesse côté Frontend
    return await this.expenseService.remove(+id, req.user.id);
  }
}
