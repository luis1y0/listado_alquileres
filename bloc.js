// bloc.js
// BLoC para gestionar el estado y eventos de alquileres

class RentalBloc {
  constructor() {
    this.state = {
      rentals: [],
      editingIndex: null,
    };
    this.listeners = [];
    this.loadFromLocal();
  }

  // Suscripción a cambios de estado
  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.state);
  }

  emit() {
    this.saveToLocal();
    this.listeners.forEach((l) => l(this.state));
  }

  // Persistencia
  saveToLocal() {
    // Filtrar _expanded antes de guardar
    const cleanRentals = this.state.rentals.map(r => {
      const { _expanded, ...rest } = r;
      return rest;
    });
    localStorage.setItem('rentals', JSON.stringify(cleanRentals));
  }

  loadFromLocal() {
    const data = localStorage.getItem('rentals');
    this.state.rentals = data ? JSON.parse(data) : [];
  }

  // Eventos
  addRental(rental) {
    this.state.rentals.push(rental);
    this.emit();
  }

  updateRental(index, rental) {
    this.state.rentals[index] = rental;
    this.state.editingIndex = null;
    this.emit();
  }

  deleteRental(index) {
    this.state.rentals.splice(index, 1);
    if (this.state.editingIndex === index) this.state.editingIndex = null;
    this.emit();
  }

  startEdit(index) {
    this.state.editingIndex = index;
    this.emit();
  }

  cancelEdit() {
    this.state.editingIndex = null;
    this.emit();
  }
}

window.RentalBloc = RentalBloc;
