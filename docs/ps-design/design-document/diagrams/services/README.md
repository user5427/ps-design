# PlantUML Diagrams for Spa/Salon Business Flows

This folder contains PlantUML diagrams for the spa/salon appointment management business flows.

## Diagram Types

### Flow Diagrams
These show the business process flow with decision points and alternative paths:
- `appointment_creation_flow.puml` - Process for creating new appointments
- `appointment_modification_flow.puml` - Process for modifying existing appointments  
- `appointment_cancellation_flow.puml` - Process for canceling appointments
- `service_customer_flow.puml` - Process for servicing customers at appointments

### Sequence Diagrams
These show the interaction between different actors and systems over time:
- `appointment_creation_sequence.puml` - Sequence for appointment creation
- `appointment_modification_sequence.puml` - Sequence for appointment modification
- `appointment_cancellation_sequence.puml` - Sequence for appointment cancellation
- `service_customer_sequence.puml` - Sequence for customer service delivery

### Overview Diagram
- `spa_salon_overview.puml` - High-level overview of all business processes

## Actors and Systems

### Actors
- **Customer** - The person requesting services
- **Employee** - Spa/salon staff member

### Systems
- **POS System** - Point of Sale system managing appointments and business logic
- **Notification System** - Handles SMS/email communications
- **Service Area** - Physical location where services are performed
- **Payment System** - Handles payment processing

## How to Use

To generate visual diagrams from these PlantUML files:

1. Install PlantUML
2. Use an editor with PlantUML support (VS Code with PlantUML extension)
3. Or use online tools like plantuml.com
4. Or generate images using command line: `plantuml *.puml`

## Entities Referenced

Based on the business flows, these diagrams reference the following entities:
- Customer
- Employee  
- Service
- Appointment
- Business (Spa/Salon)

## Components Referenced

- Appointment Management
- Employee Management  
- Notification System