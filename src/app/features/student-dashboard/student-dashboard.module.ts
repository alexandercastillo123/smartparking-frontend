import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Pages
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';

// Components
import { AvailableSpacesComponent } from './components/available-spaces/available-spaces.component';
import { ReservationModalComponent } from './components/reservation-modal/reservation-modal.component';
import { ActiveReservationComponent } from './components/active-reservation/active-reservation.component';
import { ActiveSessionComponent } from './components/active-session/active-session.component';
import { AbsenceCounterComponent } from './components/absence-counter/absence-counter.component';
import { SessionHistoryComponent } from './components/session-history/session-history.component';

const routes: Routes = [
    {
        path: '',
        component: StudentDashboardComponent
    }
];

@NgModule({
    declarations: [
        StudentDashboardComponent,
        AvailableSpacesComponent,
        ReservationModalComponent,
        ActiveReservationComponent,
        ActiveSessionComponent,
        AbsenceCounterComponent,
        SessionHistoryComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(routes)
    ]
})
export class StudentDashboardModule { }
