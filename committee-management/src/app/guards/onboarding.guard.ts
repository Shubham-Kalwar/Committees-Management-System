import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OnboardingGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    // Only STUDENT role needs onboarding check
    if (this.authService.getCurrentRole() !== 'STUDENT') {
      return new Observable<boolean>((subscriber) => {
        subscriber.next(true);
        subscriber.complete();
      });
    }

    return this.authService.checkOnboardingStatus().pipe(
      map((isOnboarded) => {
        if (isOnboarded) {
          return true;
        }

        // Redirect to onboarding if not yet completed
        return this.router.createUrlTree(['/onboarding']);
      })
    );
  }
}
