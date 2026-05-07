import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: false,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'No data available';
  @Input() subtitle = 'Data will appear here when it becomes available.';
  @Input() actionLabel = '';
  @Input() actionRoute = '';
  @Output() actionClick = new EventEmitter<void>();
}
