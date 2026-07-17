import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { DxPopupModule } from 'devextreme-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FilterBuilderToolbarComponent } from './components/filter-builder-toolbar/filter-builder-toolbar.component';
import { WasabiService, FirmGridSetting } from './services/wasabi.service';
import { confirm } from 'devextreme/ui/dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxPopupModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FilterBuilderToolbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isPopupVisible = false;
  filtersData: Record<string, string> = {};
  selectedFilterKey: string | null = null;
  editingQueryValue: string | null = null;

  queryValueControl = new FormControl<string | null>('', [this.queryValueValidator()]);

  @ViewChild('toolbar') toolbarComponent!: FilterBuilderToolbarComponent;

  constructor(private wasabiService: WasabiService) {}

  queryValueValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const val = control.value;
      if (val === null || val === undefined || val.trim().length === 0) {
        return { required: true };
      }
      return null;
    };
  }

  ngOnInit(): void {
    this.loadFilters();
    this.queryValueControl.valueChanges.subscribe(newValue => {
      this.editingQueryValue = newValue;
      if (this.toolbarComponent.mode === 'display') {
        if (this.selectedFilterKey) {
          this.toolbarComponent.enableEditMode();
        } else {
          this.toolbarComponent.enableAddMode();
        }
      }
    });
  }

  loadFilters(): void {
    this.wasabiService.get().subscribe({
      next: (data: FirmGridSetting) => {
        this.filtersData = data.AdvancedFilters || {};
      },
      error: (err) => {
        console.error('Failed to load filters', err);
      }
    });
  }

  openPopup(): void {
    const keys = Object.keys(this.filtersData || {});
    if (keys.length > 0) {
      this.selectedFilterKey = keys[0];
      this.editingQueryValue = this.filtersData[keys[0]] || null;
      this.queryValueControl.setValue(this.editingQueryValue, { emitEvent: false });
      this.queryValueControl.markAsUntouched();
    } else {
      this.selectedFilterKey = null;
      this.editingQueryValue = null;
      this.queryValueControl.setValue('', { emitEvent: false });
      this.queryValueControl.markAsTouched();
    }
    this.isPopupVisible = true;
  }

  onSelectedKeyChange(newKey: string | null): void {
    this.selectedFilterKey = newKey;
    if (newKey) {
      this.editingQueryValue = this.filtersData[newKey] || null;
      this.queryValueControl.setValue(this.editingQueryValue, { emitEvent: false });
      this.queryValueControl.markAsUntouched();
    } else {
      this.editingQueryValue = null;
      this.queryValueControl.setValue('', { emitEvent: false });
      this.queryValueControl.markAsTouched();
    }
  }

  handleRename(event: { oldKey: string; newKey: string; customValue?: string }): void {
    const { oldKey, newKey, customValue } = event;
    if (!newKey) {
      return;
    }

    // Clone the filters dictionary to trigger Angular change detection
    const updatedFilters = { ...this.filtersData };

    if (!oldKey) {
      // Adding a brand new filter when the list was empty or via Add/Copy/Query Value editing
      updatedFilters[newKey] = customValue !== undefined ? customValue : 'status = "all"';
    } else {
      const originalValue = updatedFilters[oldKey];
      updatedFilters[newKey] = customValue !== undefined ? customValue : originalValue;
      if (oldKey !== newKey) {
        delete updatedFilters[oldKey];
      }
    }

    // POST to mock backend
    this.wasabiService.post('/api/filters', { AdvancedFilters: updatedFilters }).subscribe({
      next: (response: FirmGridSetting) => {
        this.filtersData = response.AdvancedFilters || {};
        // Set selection to the saved item
        this.selectedFilterKey = newKey;
        this.editingQueryValue = this.filtersData[newKey] || null;
        this.queryValueControl.setValue(this.editingQueryValue, { emitEvent: false });
        this.queryValueControl.markAsUntouched();
      },
      error: (err) => {
        console.error('Failed to update filter name', err);
      }
    });
  }

  handleCancel(): void {
    if (this.selectedFilterKey) {
      this.editingQueryValue = this.filtersData[this.selectedFilterKey] || null;
      this.queryValueControl.setValue(this.editingQueryValue, { emitEvent: false });
      this.queryValueControl.markAsUntouched();
    } else {
      this.editingQueryValue = null;
      this.queryValueControl.setValue('', { emitEvent: false });
      this.queryValueControl.markAsUntouched();
    }
  }

  handleDelete(key: string): void {
    if (!key) {
      return;
    }

    // DevExtreme confirmation dialog
    confirm('Are you sure you want to delete this filter?', 'Delete Confirmation').then((confirmed: boolean) => {
      if (confirmed) {
        const updatedFilters = { ...this.filtersData };
        delete updatedFilters[key];

        // POST to mock backend
        this.wasabiService.post('/api/filters', { AdvancedFilters: updatedFilters }).subscribe({
          next: (response: FirmGridSetting) => {
            this.filtersData = response.AdvancedFilters || {};
            // Set selection to null as requested
            this.selectedFilterKey = null;
            this.editingQueryValue = null;
            this.queryValueControl.setValue('', { emitEvent: false });
            this.queryValueControl.markAsUntouched();
          },
          error: (err) => {
            console.error('Failed to delete filter', err);
          }
        });
      }
    });
  }
}
