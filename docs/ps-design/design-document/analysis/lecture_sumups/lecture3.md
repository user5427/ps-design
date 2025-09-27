## POS System Requirements & Specifications Summary

### 1. Functional Requirements (What the system *must* do)
* The system must model and automate core business processes, starting with a clear business flow description in plain text.
* The system must handle order management, including creating, updating, and closing orders.
* The system must support payment processing, including server-side validation of all financial calculations to prevent client-side manipulation.
* The system must manage a shopping cart that is stored on the backend to allow access from any device.
* The system must preserve historical data; for example, order details (items, prices) must be logged and remain consistent even if the menu or prices change.
* The system must not permanently delete data (soft delete) unless mandated by law.
* The system must avoid storing calculated fields (e.g., order total, tax amount) in the database; these should be calculated and returned by the application logic.
* The system must include user role management (e.g., for mechanics/employees) to track who performed which actions (e.g., creating orders, processing payments).
* For complex interactions involving multiple actors and steps, the system must be modeled using sequence or flow diagrams.
* For simple data entry forms (e.g., client intake), the system's interface must be defined using wireframes instead of complex business process modeling.

### 2. Non-Functional Requirements & Constraints (How the system *must* perform/be built)
* **Architecture & Design:** The system must be designed as a Greenfield project.
* **Data Model:** The data model must be designed correctly from the outset as it is extremely difficult to change later. It should be deliberately less normalized than theoretical perfection to avoid excessive joins and ensure performance, but must include business constraints (e.g., field nullability, value limits).
* **Consistency:** The final project documentation must be internally consistent. All sections (business flow, data model, sequence diagrams) must align without contradictions.
* **Usability/UI:** The client-side interface can perform basic validations (e.g., date formats, age checks) for responsiveness, but all critical business logic and calculations must reside on the backend.
* **Maintainability:** API contracts must be designed with care. Breaking changes must be avoided and communicated well in advance if necessary.

### 3. Integration & Hardware Specifications
* **Required Integrations:** The system must be designed to accommodate potential future integrations, such as loyalty programs or external registries (e.g., health, population), if mentioned in the business flow.
* **External Dependencies:** The business flow modeling must identify any external dependencies relevant to execution (e.g., storage systems, external registries).

### 4. Critical Project Information & Milestones
* The project is a Lab assignment (Lab 1).
* The deliverable is a comprehensive design document containing an introduction, business flow modeling, high-level architecture, and a database model.
* The document must undergo a consistency review by a designated team member acting as a final editor.
* The "rubber ducking" technique (explaining the solution aloud to a teammate or non-technical person) is a required practice for design review and debugging.
* Team collaboration and presentation of individual work to teammates for feedback is mandatory.
* Document consistency is a primary grading criterion. Inconsistent documents will result in a lower grade.
* Consultation with the instructor is recommended for design iteration and feedback.