# Team Agreement

**Course:** PS Software Design

**Project:** Lab 1 - Technical Specification & Design

**Team Name:** UniServe

**Team Members:** Tadas Riksas, Darius Spruogis, Gustas Mickus, Julius Jauga

## 1. Primary Goal
The primary goal of our team is to collaboratively produce a high-quality technical specification document and subsequent implementation, meeting all course requirements and deadlines while ensuring clear communication and equitable contribution from all members.

## 2. Team Ambition
- Our target grade: 9-10.  
- Commitment: Deliver high-quality work that meets all course requirements, ensuring fairness, learning, and a strong final implementation.

## 3. Team Member Roles & Responsibilities
To streamline our workflow, we assign the following **primary responsibilities**. 

*Note: These are primary responsibilities, not exclusive tasks. All members are expected to contribute to all areas as needed.*

| Role | Primary Responsible | Duties |
| :--- | :--- | :--- |
| **Team Lead** | @Tadas Riksas | Main point of contact for the instructor, ensures meetings are scheduled, and keeps the project on track. |
| **Documentation Lead** | @Darius Spruogis | Oversees the consolidation and final proofreading of the technical specification document (Google Doc/Overleaf). |
| **API Spec Lead** | @Gustas Mickus | Responsible for the correctness and validation of the OpenAPI YAML file. |
| **Version Control Lead** | @Julius Jauga | Manages the GitHub repository, reviews pull requests, and ensures the branching strategy is followed. |

## 4. Communication
- **Primary Channel:** Discord.  
- **Secondary Channel:** MS Teams (for lecturer communication).  
- **Response Time Expectation:** Reply within 24 hours.  
- **Rules:**  
  1. Communicate on Discord (main channel).  
  2. Reply to messages.  
  3. Be respectful and professional.  

## 5. Meetings
- Weekly **virtual sync** plus short check-ins as needed.  
- Attend all meetings if possible.  
- Notify at least 2 hours in advance if unavailable.  
- Be prepared to update teammates on assigned tasks.

## 6. Workflow & Version Control
*   **Repository:** [Here](https://github.com/user5427/ps-design)
*   **Branching Strategy:** We will use a **Feature Branch Workflow**.
    *   `main` branch: Always stable. Updated only via approved pull requests.
    *   `feature/` branches: Created for each new significant feature or section of the document (e.g., `feature/data-model`, `feature/api-auth`).
*   **Pull Request (PR) Process:**
    1.  A minimum of **one other team member** must review and approve a PR before it can be merged into `main`.
    2.  The person who did not write the code/documentation should be the one to review it.
    3.  Use the PR template for clarity.
*   **Commit Messages:** Commit messages must be clear and descriptive in the imperative mood (e.g., "`Add initial database schema diagram`" not "`added some stuff`").

### Pull Request Template
We will write in the pull request description what changes were made. Team members can follow this template (or not).
```markdown
## What does this PR do?
[Description of changes]

## Related Documents/Tickets
[Link to related Google Doc section, issue, etc.]

## Steps to Test
1. [Step 1]
2. [Step 2]

## Notes for Reviewers
[Any specific questions or points you want the reviewer to focus on]
```

## 7. Progress Tracking
- Tasks tracked using **GitHub Projects**.  
- Documentation managed in **Overleaf/Google Docs**.  
- Weekly updates pushed to the repository.  
- Everyone should be able to see what others are working on.  
- Progress updates are expected regularly.

## 8. Capacity Constraints
- Each member reports their weekly availability.  
- Track planned vs actual hours spent.  
- Tasks should be planned realistically to avoid overload.  
- If someone cannot meet capacity, they must notify the team.  
- Avoid tasks that block others—strive for parallel work.

## 9. Conflict Resolution
1.  **Technical Disagreements:** We will first discuss the options based on their technical merit. If a consensus cannot be reached, we will take a simple majority vote.
2.  **workload Distribution Issues:** If a member feels overwhelmed or notices unequal contribution, they will bring it up immediately in the team chat for discussion and re-allocation.
3.  **Escalation:** If the team cannot resolve a conflict internally after discussion, we will **jointly** contact the instructor for guidance.

## 10. Expectations & Commitment
We acknowledge that this project requires a significant time investment. We commit to:
*   **Proactive Communication:** Informing the team immediately of any unforeseen circumstances that might affect our deadlines or workload.
*   **Meeting Participation:** Attending all scheduled meetings. If unable to attend, we will notify the team at least 2 hours in advance and review the meeting notes afterward.
*   **Deadlines:** Our absolute deadline for the first technical specification document is **October 18th**. We will set an internal soft deadline for a complete draft by **October 16th** to allow time for final review.

## 11. Respect & Accountability
- Value everyone’s ideas and contributions.  
- Share workload fairly.  
- Stay constructive and professional.  
- Tasks must have a clear owner and expected output.  
- If falling behind, communicate early and seek help.  
- Members must be willing to help each other; tasks should be documented well enough to be picked up by others.  

## 12. Sanctions & Penalties
If a team member repeatedly misses deadlines, meetings, or fails to contribute, penalties may apply:  
- **Snack tax or beer tax.**
- **Extra documentation duty.**  
- **Bug fix duty.**  

## 13. Use of AI
AI tools (e.g., ChatGPT, GitHub Copilot) may be leveraged for efficiency.  
- **Allowed uses:**  
  - Drafting documentation.  
  - Generating boilerplate code.  
  - Brainstorming and clarifying concepts.  
- **Rules:**  
  - All AI-generated content must be **reviewed and validated** by a team member before acceptance.  
  - AI cannot replace understanding, responsibility remains with the team.  
  - If AI assistance is significant, note it in documentation, or inform the lecturer.

## 14. Definition of "Done"
A section of the document or a piece of code is considered "done" when:
- [ ] It meets the requirements outlined in the assignment.
- [ ] It has been reviewed and approved by at least one other team member.
- [ ] For code: It is merged into the `main` branch.
- [ ] For documentation: It is integrated into the shared Google Doc/Overleaf document.

## 15. Technology Stack
- Primary implementation language: TypeScript

---
**Last Updated:** 2025-10-20