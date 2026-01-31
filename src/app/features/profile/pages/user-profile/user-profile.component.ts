import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { ProfileService } from "../../services/profile.service";
import { UserProfile } from "../../models/user-profile.model";
import { AuthenticationService } from "../../../iam/services/authentication.service";
import { CommonModule } from "@angular/common";
import { InputComponent } from "../../../../shared/input/input.component";
import { ButtonComponent } from "../../../../shared/button/button.component";

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    InputComponent,
    ButtonComponent
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  isEditing = false;

  firstName = '';
  lastName = '';
  userStatus = '';
  userTotalReserves = 0;
  userCanceledReserves = 0;
  userExpiredReserves = 0;
  userRole = '';

  // Password change
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = '';

  ngOnInit(): void {
    this.authenticationService.currentUserStatus.subscribe(
      (status: string) => {
        this.userStatus = status;
      }
    );
    this.authenticationService.currentUserRole.subscribe(
      (role: string) => {
        this.userRole = role;
        if (role === 'university_member') {
          this.loadHistory();
        }
      }
    );
    this.profileService.getProfile().subscribe(
      (response: any) => {
        console.log('User profile data:', response);
        this.firstName = response.firstName;
        this.lastName = response.lastName;
      });
  }

  loadHistory(): void {
    this.profileService.getHistory().subscribe(
      (response: any) => {
        console.log('User reservation history:', response);
        this.userTotalReserves = response.length;
        for (let reserve of response) {
          if (reserve.status === 'cancelled') {
            this.userCanceledReserves += 1;
          }
          if (reserve.status === 'expired') {
            this.userExpiredReserves += 1;
          }
        }
      }
    );
  }

  constructor(
    private profileService: ProfileService,
    private authenticationService: AuthenticationService
  ) {
  }

  onSaveProfile() {
    this.isEditing = false;
    const payload: UserProfile = {
      firstName: this.firstName,
      lastName: this.lastName
    }
    this.profileService.putProfile(payload).subscribe(
      (response: any) => {
        console.log('Profile updated successfully', response);
        alert('Perfil actualizado correctamente');
      },
      (error: any) => {
        console.error('Error updating profile', error);
        alert('Error al actualizar el perfil');
      }
    )
  }

  onChangePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordError = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    // Call backend to change password
    this.profileService.changePassword(this.newPassword).subscribe(
      (response: any) => {
        console.log('Password changed successfully', response);
        this.passwordSuccess = 'Contraseña cambiada exitosamente';
        this.newPassword = '';
        this.confirmPassword = '';

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.passwordSuccess = '';
        }, 3000);
      },
      (error: any) => {
        console.error('Error changing password', error);
        this.passwordError = 'Error al cambiar la contraseña. Intenta de nuevo.';
      }
    );
  }
}

