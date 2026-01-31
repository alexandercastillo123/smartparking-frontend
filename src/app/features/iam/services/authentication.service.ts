import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { environment } from "../../../../environments/environment";
import { decodeJwt } from "../../../utils/jwt";

import { SignInRequest } from "../model/sign-in.request";
import { SignInResponse } from "../model/sign-in.response";
import { SignUpRequest } from "../model/sign-up.request";
import { SignUpResponse } from "../model/sign-up.response";
import { Router } from "@angular/router";
import { logOutRequest } from "../model/log-out.request";

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  basePath: string = `${environment.apiUrl}`;
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };



  private signedIn = new BehaviorSubject<boolean>(false);
  private signedInUserId = new BehaviorSubject<string>('');
  private signedInUserRole = new BehaviorSubject<string>('');
  private signedInUserStatus = new BehaviorSubject<string>('');

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
  }

  initSession() {
    if (typeof window === 'undefined') return; // SSR protection

    const token = sessionStorage.getItem('token');

    if (!token) {
      this.signedIn.next(false);
      return;
    }

    try {
      const data = decodeJwt(token);

      this.signedIn.next(true);
      const userId = data.userId || data.id || data.sub || '';
      this.signedInUserId.next(userId);
      this.signedInUserRole.next(data.role);

      // Sync to localStorage so components can read it easily
      if (userId) {
        localStorage.setItem('userId', userId);
      }
    } catch (e) {
      console.error('Invalid token', e);
      sessionStorage.removeItem('token');
      this.signedIn.next(false);
    }
  }



  get isSignedIn() {
    return this.signedIn.asObservable();
  }
  get currentUserId() {
    return this.signedInUserId.asObservable();
  }

  get currentUserIdValue(): string {
    return this.signedInUserId.value;
  }

  get currentUserRole() {
    return this.signedInUserRole.asObservable();
  }

  get currentUserRoleValue(): string {
    return this.signedInUserRole.value;
  }

  get currentUserStatus() {
    return this.signedInUserStatus.asObservable();
  }

  getUserDataFromToken(): void {
    const token = sessionStorage.getItem('token');

    if (!token) return;

    try {
      const data = decodeJwt(token)

      this.signedIn.next(true);
      this.signedInUserId.next(data.userId || data.id || data.sub || '');
      this.signedInUserRole.next(data.role);

    } catch (error) {
      console.error('Error decoding JWT token:', error);
    }
  }


  signUpAdmin(signUpRequest: SignUpRequest) {
    return this.http.post<SignUpResponse>(`${this.basePath}/auth/users/register/administrator`, signUpRequest, this.httpOptions)
      .subscribe({
        next: (response) => {
          console.log(`Signed up as ${response.email} with id: ${response.userId}`);
          this.router.navigate(['login']).then();
        },
        error: (error) => {
          console.error(`Error while signing up: ${error}`);
          this.router.navigate(['register']).then();
        }
      });
  }

  signUpUniversityMember(signUpRequest: SignUpRequest) {
    return this.http.post<SignUpResponse>(`${this.basePath}/auth/users/register/university-member`, signUpRequest, this.httpOptions)
      .subscribe({
        next: (response) => {
          console.log(`Signed up as ${response.email} with id: ${response.userId}`);
          this.router.navigate(['login']).then();
        },
        error: (error) => {
          console.error(`Error while signing up: ${error}`);
          this.router.navigate(['register']).then();
        }
      });
  }
  signIn(signInRequest: SignInRequest): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.basePath}/auth/users/login`, signInRequest, this.httpOptions)
      .pipe(
        tap({
          next: (response: SignInResponse) => {
            sessionStorage.setItem('token', response.token);
            // Save userId to localStorage for persistence across reloads if needed, 
            // but importantly for the reservation component to access it easily
            this.getUserDataFromToken();
            sessionStorage.setItem('signInId', response.sessionId);

            // Save userId to localStorage from the decoded token
            // This is required because the backend login response body might not contain the ID directly
            if (this.signedInUserId.value) {
              console.log('Saving userId to localStorage from token:', this.signedInUserId.value);
              localStorage.setItem('userId', this.signedInUserId.value);
            }

            console.log(`Signed in with token ${response.token} and id ${this.signedInUserId.value} and role ${this.signedInUserRole.value}`);

            this.signedInUserStatus.next(response.status);
          },
          error: (error: any) => {
            this.signedIn.next(false);
            this.signedInUserId.next('');
            this.signedInUserRole.next('');
            console.error(`Error while signing in: ${error}`);
          }
        })
      );
  }

  logOut() {
    return this.http.post<logOutRequest>(`${this.basePath}/auth/users/logout/${sessionStorage.getItem('signInId')}`, this.httpOptions)
      .subscribe({
        next: (response) => {
          this.signedIn.next(false);
          this.signedInUserId.next('');
          this.signedInUserRole.next('');
          sessionStorage.removeItem('token');
          this.router.navigate(['login']).then();
        },
        error: (error) => {
          console.error(`Error while logging out: ${error}`);
        }
      })
  };
}
