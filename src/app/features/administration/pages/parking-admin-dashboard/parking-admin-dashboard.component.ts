import { Component, OnInit } from '@angular/core';
import { ReservationModel } from "../../model/reservation.model";
import { AdminDashboardService } from "../../services/admin.dashboard.service";
import { UserModel } from "../../model/user.model";
import { UserService } from "../../services/user.service";
import { CommonModule, NgFor, NgIf } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { ParkingSpaceService } from "../../../../services/parking-space.service";
import { ParkingSpaceModel } from "../../../../services/model/parking-space.model";
import { FormsModule } from "@angular/forms";
import { ParkingSpaceRequest } from "../../../../services/model/parking-space.request";
import { ReservationService } from "../../../dashboard/services/reservation.service";
import { Router } from "@angular/router";

@Component({
  selector: 'app-parking-admin-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, NgFor, NgIf, FormsModule],
  templateUrl: './parking-admin-dashboard.component.html',
  styleUrl: './parking-admin-dashboard.component.scss'
})
export class ParkingAdminDashboardComponent implements OnInit {
  ReservationList: ReservationModel[] = [];
  UserList: UserModel[] = [];
  ParkingSpacesList: ParkingSpaceModel[] = [];
  selectedUser: UserModel | undefined;
  newParkingSpace: ParkingSpaceRequest | undefined;

  overlayOpen = false;
  addOverlayOpen = false;

  suspendedUsers = 0;
  occupiedSpaces = 0;
  reservedSpaces = 0;
  maintenanceSpaces = 0;
  newSpacesCount = 1; // Default to 1
  isCreatingSpaces = false;

  ngOnInit(): void {
    this.refreshAllData();
  }

  refreshAllData(): void {
    // Espacios por estado
    this.parkingSpaceService.getParkingSpaceByStatus('reserved')
      .subscribe(res => this.reservedSpaces = res.length);
    this.parkingSpaceService.getParkingSpaceByStatus('occupied')
      .subscribe(res => this.occupiedSpaces = res.length);
    this.parkingSpaceService.getParkingSpaceByStatus('maintenance')
      .subscribe(res => this.maintenanceSpaces = res.length);

    // Todos los espacios
    this.parkingSpaceService.getAllParkingSpaces()
      .subscribe(res => this.ParkingSpacesList = res || []);

    // Todas las reservas
    this.dashboardService.getAllReservations()
      .subscribe(res => this.ReservationList = res || []);

    // Todos los usuarios
    this.userService.getAllUsers().subscribe(res => {
      this.UserList = res || [];
      this.suspendedUsers = this.UserList.filter(u => u.status === 'suspended').length;
    });
  }

  constructor(
    private dashboardService: AdminDashboardService,
    private userService: UserService,
    private parkingSpaceService: ParkingSpaceService,
    private reservationService: ReservationService,
    private router: Router
  ) {
  }

  viewUserHistory(email: string | undefined): void {
    if (!email) return;
    this.router.navigate(['/admin/reports'], { queryParams: { user: email } });
  }

  // Metodos de simulación para Admin
  confirmArrival(resId: string) {
    this.reservationService.confirmArrival(resId).subscribe(() => this.refreshAllData());
  }

  completeReservation(resId: string) {
    this.reservationService.endSession(resId).subscribe(() => this.refreshAllData());
  }

  cancelReservation(resId: string) {
    this.reservationService.cancelReservation(resId, 'Cancelado por Admin').subscribe(() => this.refreshAllData());
  }

  openOverlay(user: UserModel): void {
    this.selectedUser = user;
    this.overlayOpen = true;
  }

  closeOverlay(): void {
    this.overlayOpen = false;
    this.selectedUser = undefined;
  }

  openAddOverlay() {
    this.addOverlayOpen = true;
  }

  closeAddOverlay() {
    this.addOverlayOpen = false;
  }

  confirmAddSpaces() {
    if (this.newSpacesCount <= 0 || this.isCreatingSpaces) return;

    if (!this.newParkingSpace) {
      this.newParkingSpace = {} as ParkingSpaceRequest;
    }

    this.isCreatingSpaces = true;
    const requests = [];
    const baseCount = this.ParkingSpacesList.length;

    for (let i = 0; i < this.newSpacesCount; i++) {
      const spaceReq = { ...this.newParkingSpace }; // Clone
      // Ensure we increment from the current total + i
      spaceReq.code = this.generateSpaceCode(baseCount + 1 + i);
      spaceReq.status = 'available';

      requests.push(this.parkingSpaceService.postParkingSpace(spaceReq));
    }

    let completed = 0;
    let successful = 0;

    requests.forEach(req => {
      req.subscribe({
        next: (res) => {
          this.ParkingSpacesList.push(res);
          successful++;
          completed++;
          if (completed === requests.length) {
            this.finishAddSpaces(successful);
          }
        },
        error: (err) => {
          console.error(err);
          completed++;
          if (completed === requests.length) {
            this.finishAddSpaces(successful);
          }
        }
      })
    });
  }

  finishAddSpaces(count: number) {
    this.isCreatingSpaces = false;
    this.closeAddOverlay();
    const message = count > 0
      ? `Se agregaron correctamente ${count} lugares de estacionamiento`
      : 'No se pudieron agregar los espacios';
    alert(message);
    this.newSpacesCount = 1;
    this.refreshAllData();
  }

  private generateSpaceCode(n: number): string {
    return `A${n}`;
  }

}
