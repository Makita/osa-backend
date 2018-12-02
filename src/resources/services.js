/**
 * This file holds the services that are available for booking. It is used to display said services
 * on the appointment form page as well as for calculating the end times for work when the form is
 * submitted.
 */

module.exports = [
  {
    slug: "braking_fluid_flush",
    name: "Braking fluid flush",
    time: 30
  },
  {
    slug: "cooling_system_flush",
    name: "Cooling system flush",
    time: 60
  },
  {
    slug: "oil_change",
    name: "Oil change",
    time: 30
  },
  {
    slug: "tire_swap",
    name: "Tire swap",
    time: 60
  },
  {
    slug: "transmission_service",
    name: "Transmission service",
    time: 60
  },
  {
    slug: "wheel_alignment",
    name: "Wheel alignment",
    time: 60
  }
];