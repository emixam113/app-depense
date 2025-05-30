import {Controller, Post, Body, NotFoundException} from '@nestjs/common'; 
import {MailService} from './mail.service';
import {UserService} from '../user/user.service';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService
  ) {}

  @Post('reset-password')
  async sendResetPassword(
    @Body('email') email: string,
    @Body('birthDate') birthDate: string
  ){
    const user = await this.userService.findByEmail(email);
    if(!user){
      throw new NotFoundException('Aucun utilisateur trouvé avec cet email');
    }
    
   //comparaison entre Date et string
   const formatedBirthDate = user.birthDate.toISOString().split('T')[0];
   if (formatedBirthDate !== birthDate){
    throw new NotFoundException('les informations ne correspondent pas')
   }

   //envoie de l'email de reinitialisation de mot de passe 
   const token = await this.mailService.sendResetPasswordConfirmation(email, user.firstName);

   return {message: 'Email envoyé', token};
  }
}
