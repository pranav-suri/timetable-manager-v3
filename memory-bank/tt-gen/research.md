w# A Robust Genetic Algorithm Framework for the University Timetabling Problem: A Constraint Satisfaction and Optimization Approach

## Abstract

This report presents a comprehensive design for a robust Genetic Algorithm (GA) to solve the NP-hard University Course Timetabling Problem (UCTP), formulated as a Constraint Satisfaction and Optimization Problem (CSOP). We detail a specific and implementable framework, beginning with a formal problem definition that delineates critical input entities and a rigorous classification of hard and soft constraints.

The proposed methodology centers on a direct, linearized chromosome representation for computational efficiency and intuitive mapping to the solution space. A key innovation is a hierarchical, penalty-based fitness function designed to aggressively prioritize the satisfaction of all hard constraints before optimizing for soft constraints, thereby ensuring the generation of feasible schedules.

We provide a detailed specification of tailored genetic operators, including:

- A hybrid population initialization strategy
- Tournament Selection for balanced selective pressure
- A constraint-aware Uniform Crossover with an integrated repair mechanism
- A multi-strategy mutation operator

The framework is completed with empirically-grounded guidelines for parameter tuning, a multi-conditional termination strategy, and a discussion of advanced enhancements such as memetic hybridization and parallelization. The final section outlines the process for decoding the optimized genotype into a human-readable timetable, with a practical example of serialization to a JSON format for integration with modern information systems.

---

## Section 1: Formalization of the Timetabling Problem as a CSOP

The University Course Timetabling Problem (UCTP) is a prominent example of a large-scale scheduling task belonging to the NP-hard complexity class.[^1] This classification signifies that no deterministic algorithm can find an optimal solution in polynomial time, making heuristic and metaheuristic approaches like Genetic Algorithms particularly suitable.[^4]

The problem involves arranging a set of events (lectures, tutorials, labs) into a finite number of timeslots and rooms, subject to a variety of constraints.[^5] Formulating this task as a Constraint Satisfaction and Optimization Problem (CSOP) provides a precise mathematical foundation that is essential for designing an effective algorithmic solution.[^7]

This formalization requires a clear definition of the input entities that constitute the problem space and a strict categorization of the constraints that govern the validity and quality of any potential solution.

### 1.1 Defining Input Entities and the Search Space

A robust timetabling system must begin with a structured and unambiguous definition of its core components. These entities, derived from the real-world operational data of an academic institution, form the building blocks of the scheduling problem.[^5] The search space is the vast set of all possible assignments of these entities to available resources (timeslots and rooms).

The fundamental input entities are defined as follows:

#### **Courses ($C$)**

A set $C = \{c_1, c_2,..., c_n\}$ representing all courses to be scheduled. Each course $c_i$ is a tuple of attributes:

- **CourseID**: A unique identifier
- **CourseName**: A human-readable name
- **LecturerID**: The identifier of the lecturer assigned to teach the course
- **StudentGroupIDs**: A list of identifiers for student groups enrolled in the course
- **ExpectedEnrollment**: The total number of students expected to attend
- **RequiredRoomFeatures**: A list of special requirements for the room (e.g., "Projector," "Lab Equipment," "Whiteboard")
- **Duration**: The number of consecutive timeslots the course session requires

#### **Lecturers ($L$)**

A set $L = \{l_1, l_2,..., l_m\}$ representing all teaching staff. Each lecturer $l_j$ is defined by:

- **LecturerID**: A unique identifier
- **LecturerName**: The name of the lecturer
- **Availability**: A binary matrix or list of unavailable timeslots, indicating when the lecturer cannot teach[^4]

#### **Student Groups ($G$)**

A set $G = \{g_1, g_2,..., g_p\}$ representing distinct cohorts of students (e.g., "First Year Computer Science," "Final Year Electrical Engineering"). Each group $g_k$ is defined by:

- **GroupID**: A unique identifier
- **GroupName**: The name of the group
- **CourseIDs**: A list of CourseIDs that this group is required to attend

#### **Rooms ($R$)**

A set $R = \{r_1, r_2,..., r_q\}$ representing all available physical locations. Each room $r_u$ is defined by:

- **RoomID**: A unique identifier
- **RoomName**: The name or number of the room
- **Capacity**: The maximum number of seats available in the room[^9]
- **Features**: A list of available equipment or features in the room

#### **Timeslots ($T$)**

A discrete set $T = \{t_1, t_2,..., t_v\}$ representing all available scheduling periods. Timeslots are typically linearized for computational convenience, where a single integer represents a specific day and time.[^6]

For example, in a 5-day week with 8 periods per day, there would be 40 timeslots, where:

- Timeslot 0 = Monday Period 1
- Timeslot 8 = Tuesday Period 1
- And so on...

#### **Scheduled Event ($E$)**

The fundamental unit of a timetable solution is a scheduled event, which is an assignment tuple $e = (c, r, t)$, signifying that course $c \in C$ is scheduled in room $r \in R$ at timeslot $t \in T$.

The goal of the algorithm is to produce a complete set of such assignments for all required course sessions that is both valid and optimal.

#### **Table 1: Input Entity Definitions**

The following table provides a structured summary of these entities, serving as a data model for implementation.

| Entity            | Attribute            | Data Type     | Description                                                |
| ----------------- | -------------------- | ------------- | ---------------------------------------------------------- |
| **Course**        | CourseID             | Integer       | Unique identifier for the course                           |
|                   | CourseName           | String        | Human-readable name of the course                          |
|                   | LecturerID           | Integer       | Foreign key referencing the assigned lecturer              |
|                   | StudentGroupIDs      | List[Integer] | List of foreign keys referencing enrolled student groups   |
|                   | ExpectedEnrollment   | Integer       | Number of students registered for the course               |
|                   | RequiredRoomFeatures | List          | List of features the room must possess (e.g., 'Projector') |
|                   | Duration             | Integer       | Number of consecutive timeslots required                   |
| **Lecturer**      | LecturerID           | Integer       | Unique identifier for the lecturer                         |
|                   | LecturerName         | String        | Name of the lecturer                                       |
|                   | Availability         | List[Integer] | List of unavailable TimeslotIDs                            |
| **Student Group** | GroupID              | Integer       | Unique identifier for the student group                    |
|                   | GroupName            | String        | Name of the student cohort                                 |
|                   | CourseIDs            | List[Integer] | List of CourseIDs this group must attend                   |
| **Room**          | RoomID               | Integer       | Unique identifier for the room                             |
|                   | RoomName             | String        | Name or number of the room                                 |
|                   | Capacity             | Integer       | Maximum number of seats                                    |
|                   | Features             | List          | List of available features in the room                     |
| **Timeslot**      | TimeslotID           | Integer       | Unique identifier for the time period (0 to N-1)           |
|                   | DayOfWeek            | String        | Day corresponding to the timeslot (e.g., 'Monday')         |
|                   | Period               | Integer       | Period number within the day                               |
