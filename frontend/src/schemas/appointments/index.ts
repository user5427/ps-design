// Re-export all appointment types from the shared schemas package
export type {
  ServiceDefinitionResponse,
  CreateServiceDefinitionBody,
  UpdateServiceDefinitionBody,
} from "@ps-design/schemas/appointments/service-definition";

export type {
  StaffServiceResponse,
  CreateServiceBody,
  UpdateServiceBody,
} from "@ps-design/schemas/appointments/service";

export type {
  AvailabilityResponse,
  BulkSetAvailabilityBody,
  CreateAvailabilityBody,
  DayOfWeek,
} from "@ps-design/schemas/appointments/availability";

export type {
  AppointmentResponse,
  CreateAppointmentBody,
  UpdateAppointmentBody,
  AppointmentFilterQuery,
  AppointmentStatus,
} from "@ps-design/schemas/appointments/appointment";

// Type aliases for convenience
export type ServiceDefinition =
  import("@ps-design/schemas/appointments/service-definition").ServiceDefinitionResponse;
export type CreateServiceDefinition =
  import("@ps-design/schemas/appointments/service-definition").CreateServiceDefinitionBody;
export type UpdateServiceDefinition =
  import("@ps-design/schemas/appointments/service-definition").UpdateServiceDefinitionBody;

export type StaffService =
  import("@ps-design/schemas/appointments/service").StaffServiceResponse;
export type CreateStaffService =
  import("@ps-design/schemas/appointments/service").CreateServiceBody;
export type UpdateStaffService =
  import("@ps-design/schemas/appointments/service").UpdateServiceBody;

export type Availability =
  import("@ps-design/schemas/appointments/availability").AvailabilityResponse;

export type Appointment =
  import("@ps-design/schemas/appointments/appointment").AppointmentResponse;
export type CreateAppointment =
  import("@ps-design/schemas/appointments/appointment").CreateAppointmentBody;
export type UpdateAppointment =
  import("@ps-design/schemas/appointments/appointment").UpdateAppointmentBody;
