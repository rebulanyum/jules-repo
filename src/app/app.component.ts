import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdvancedFiltersDialogComponent } from './components/advanced-filters-dialog/advanced-filters-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    AdvancedFiltersDialogComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private dialog: MatDialog) {}

  openPopup(): void {
    this.dialog.open(AdvancedFiltersDialogComponent, {
      width: '750px',
      height: '550px',
      disableClose: true
    });
  }
}
