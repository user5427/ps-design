## POS System Requirements & Specifications Summary

### 1. Functional Requirements (What the system *must* do)
* The system must support two primary business types: 1) Bars/Restaurants/Cafes (order-based) and 2) Beauty Centers/Barbers/Spa Salons (appointment-based).
* For order-based businesses, the system must allow employees to create, modify, and close orders.
* Orders can only be modified while open; closed/paid orders are read-only but can be refunded.
* The system must support multiple payment methods per order (e.g., cash, gift card, credit card).
* The system must support split-check functionality, allowing multiple payments against a single order with customizable amounts (e.g., different individuals paying for specific items).
* The system must allow employees to add tips to an order (e.g., a fixed amount or a percentage).
* The system must allow employees or managers to apply discounts to an entire order or to individual items.
* The system must generate a final, detailed receipt for each transaction, showing items, costs, taxes, discounts, and the total sum.
* For appointment-based businesses, the system must allow employees to create, cancel, and manage reservations/appointments.
* Each appointment must record the customer's name, contact information, service time, duration, and the assigned employee.
* The system must prevent double-booking by checking employee availability and preventing overlapping appointments for the same employee.
* The system must integrate with an SMS gateway to automatically send confirmation messages to customers when an appointment is created.
* The system must manage user authentication and authorization, ensuring only authorized employees can perform operations.
* The system must support a role-based permission system to define what actions different users can perform.
* The system must support multiple, separate businesses within a single, unified database instance. Data must be securely partitioned so each business only sees its own information.
* The system must allow for the creation and modification of products and services, including support for variations/modifiers (e.g., coffee type, milk type), with associated pricing changes.
* The system must manage tax rates (e.g., VAT), which can change over time. Historical orders must retain the tax rate applicable at the time of the transaction.
* The system must track service charges or business rules that may change, with historical orders retaining the rules applicable at the time of transaction.
* The system must have a "super admin" user role for system operators to assist businesses.

### 2. Non-Functional Requirements & Constraints (How the system *must* perform/be built)
* **Data Integrity & History:** Changes to product details, tax rates, and business rules must not affect historical orders or records. Historical data must be immutable in this regard.
* **Multi-Tenancy:** The system must be designed as a single, multi-tenant application where multiple businesses operate in isolation within one database. Creating a separate database per business is not an acceptable design.
* **Availability:** The system is assumed to be online. Offline functionality and data reconciliation are considered out of scope due to complexity.
* **Usability/UI:** The user interface must be operable by business employees. The design should accommodate different business types (e.g., order vs. appointment) within the same application, potentially through configurable views.

### 3. Integration & Hardware Specifications
* **Required Integrations:**
    * Payment processing integration (e.g., Stripe) is required for credit card transactions.
    * SMS gateway integration (e.g., AWS SNS) is required for sending appointment confirmations.
* **Operating Environment:** The backend must be accessible via a web-based frontend. The specific technology stack is at the development team's discretion.

### 4. Critical Project Information & Milestones
* **Documentation Deliverables:** Two primary documents are required: 1) A shared, collaborative design document (e.g., Google Docs, Overleaf) for system design, and 2) A separate YAML file containing the OpenAPI specification for the REST API.
* **Repository:** All project artifacts (YAML file, team agreement) must be stored in a shared team repository accessible to the instructor.
* **Key Deadline:** The final submission deadline for the design document is **October 18th**. The document will be shared with another team for implementation in a subsequent phase.
* **API Specification:** The OpenAPI YAML file must be syntactically correct, as errors will result in parts of the specification being ignored during evaluation. A dedicated lecture will cover API documentation standards.