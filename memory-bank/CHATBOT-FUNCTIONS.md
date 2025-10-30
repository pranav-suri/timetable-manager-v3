# Chatbot Functions Implementation Guide

## Overview

This document describes the 10 read-only AI-powered functions implemented for the Timetable Manager chatbot. These functions enable users to query timetable data and receive intelligent insights through natural language conversations.

## Architecture

### File Structure

```
src/server/services/gemini/
├── client.ts                    # Gemini API client with function calling
├── functions.ts                 # Function definitions and routing
└── implementations/
    ├── utils.ts                 # Shared utilities
    ├── information.ts           # Phase 1: Information retrieval functions
    └── insights.ts              # Phase 3: AI-powered insight functions
```

### Data Flow

```
User Query → Chatbot UI → tRPC → Gemini AI → Function Call
                                      ↓
                        Function Context (prisma, timetableId, organizationId)
                                      ↓
                        Implementation Function → Database Query
                                      ↓
                        JSON Response → Gemini AI → Natural Language Response → User
```

## Implemented Functions

### Phase 1: Information Retrieval (5 Functions)

#### 1. `get_teachers_list`
**Purpose**: List all teachers with optional filtering

**Example Queries**:
- "Show me all teachers"
- "Who teaches Mathematics?"
- "Which teachers have at least 5 hours available?"

**Parameters**:
- `subjectName` (optional): Filter by subject
- `minAvailableHours` (optional): Minimum available capacity

**Returns**: Array of teachers with workload details

---

#### 2. `get_schedule_for_entity`
**Purpose**: Get complete schedule for teacher/classroom/subdivision

**Example Queries**:
- "What's Dr. Smith's schedule?"
- "Show me Room 301's schedule for Monday"
- "When does Division A have classes?"

**Parameters**:
- `entityType` (required): "teacher", "classroom", or "subdivision"
- `entityId` or `entityName` (one required): Entity identifier
- `day` (optional): Specific day filter (0-6)

**Returns**: Complete schedule with utilization statistics

---

#### 3. `find_available_slots`
**Purpose**: Find free time slots for an entity

**Example Queries**:
- "When is Prof. Johnson available?"
- "Find 3 consecutive free slots for Division B"
- "Is Room 205 free on Wednesday?"

**Parameters**:
- `entityType` (required): Entity type
- `entityId` or `entityName` (one required): Entity identifier
- `day` (optional): Day filter
- `consecutiveSlots` (optional): Find N consecutive slots

**Returns**: Available slots with consecutive block detection

---

#### 4. `check_conflicts`
**Purpose**: Detect scheduling conflicts

**Example Queries**:
- "Are there any conflicts in the schedule?"
- "Check for teacher double-bookings"
- "Show conflicts for Dr. Smith"

**Parameters**:
- `scope` (optional): "all", "teachers", "classrooms", "subdivisions"
- `entityId` (optional): Check specific entity

**Returns**: Detailed conflict list with recommendations

---

#### 5. `get_timetable_statistics`
**Purpose**: Overall timetable metrics and health

**Example Queries**:
- "Give me timetable statistics"
- "How is the schedule doing?"
- "Show me utilization metrics"

**Returns**: Comprehensive statistics including:
- Resource counts
- Utilization percentages
- Workload distribution
- Conflict summary

---

### Phase 3: AI-Powered Insights (5 Functions)

#### 6. `suggest_lecture_placement`
**Purpose**: Recommend optimal slots for a lecture

**Example Queries**:
- "Where should I place this Math lecture?"
- "Suggest slots for lecture xyz123"
- "Best time for this class, avoiding consecutive lectures?"

**Parameters**:
- `lectureId` (required): Lecture to place
- `preferredDays` (optional): Preferred days array
- `avoidConsecutive` (optional): Avoid back-to-back lectures

**Returns**: Scored recommendations (0-100) with:
- Pros and cons for each slot
- Workload impact analysis
- Reasoning for each recommendation

**Scoring Algorithm** (100 points total):
- Availability (30pts)
- Workload Balance (25pts)
- Weekly Distribution (20pts)
- Student Experience (15pts)
- Preference Match (10pts)

---

#### 7. `find_substitute_teacher`
**Purpose**: Find replacement teachers

**Example Queries**:
- "Who can substitute for Physics lecture?"
- "Find a replacement for Prof. Davis"
- "Alternative teachers for Math on Monday slot 3"

**Parameters**:
- `subjectName` (required): Subject needing coverage
- `slotId` (required): Time slot
- `primaryTeacherId` (optional): Teacher to exclude

**Returns**: Ranked substitutes with:
- Suitability scores
- Subject expertise match
- Availability and capacity
- Concerns and recommendations

**Scoring Algorithm** (100 points total):
- Subject Expertise (40pts)
- Availability (30pts)
- Capacity (20pts)
- Quality/Balance (10pts)

---

#### 8. `recommend_classroom`
**Purpose**: Suggest suitable classrooms

**Example Queries**:
- "Which classroom for this lecture?"
- "Recommend a room for Physics lab"
- "Best classroom for Division A Math class"

**Parameters**:
- `lectureId` (required): Lecture needing classroom
- `slotId` (optional): If slot already chosen

**Returns**: Scored classroom options with:
- Availability status
- Subject compatibility
- Utilization balance

**Scoring Algorithm** (100 points total):
- Availability (50pts)
- Subject Compatibility (30pts)
- Utilization Balance (20pts)

---

#### 9. `analyze_teacher_workload`
**Purpose**: Deep workload analysis

**Example Queries**:
- "Analyze teacher workload"
- "Is anyone overloaded?"
- "Show me Dr. Smith's workload analysis"

**Parameters**:
- `teacherId` (optional): Specific teacher or all

**Returns**: Detailed analysis including:
- Current vs. maximum hours
- Daily breakdown
- Consecutive lecture patterns
- Gap analysis
- Status (overloaded/balanced/underutilized)
- Specific concerns and recommendations

**Insights Generated**:
- Most overloaded teacher
- Most underutilized teacher
- Average utilization percentage
- Actionable recommendations

---

#### 10. `suggest_optimization`
**Purpose**: Comprehensive timetable improvement suggestions

**Example Queries**:
- "How can I improve the timetable?"
- "Optimize for balanced workload"
- "Suggest improvements to reduce conflicts"

**Parameters**:
- `optimizationGoal` (optional): Focus area
  - "balance_workload"
  - "minimize_gaps"
  - "maximize_utilization"
  - "reduce_conflicts"

**Returns**: Strategic recommendations including:
- Health score (0-100)
- Major issues list
- Opportunity areas
- Prioritized recommendations (high/medium/low)
- Quick wins
- Long-term suggestions

**Health Score Calculation**:
- Start at 100
- Deduct for conflicts (up to 30pts)
- Deduct for workload imbalance
- Deduct for over/under-utilized resources

---

## Usage Examples

### Natural Language Queries

The AI automatically maps these queries to the appropriate functions:

```
User: "Show me all teachers teaching Mathematics"
→ Calls: get_teachers_list(subjectName: "Mathematics")

User: "What's Dr. Smith's schedule for Monday?"
→ Calls: get_schedule_for_entity(entityType: "teacher", entityName: "Dr. Smith", day: 0)

User: "When is Room 305 available on Thursday?"
→ Calls: find_available_slots(entityType: "classroom", entityName: "Room 305", day: 3)

User: "Are there any scheduling conflicts?"
→ Calls: check_conflicts(scope: "all")

User: "How's the timetable looking overall?"
→ Calls: get_timetable_statistics()

User: "Where should I schedule this Math lecture?"
→ Calls: suggest_lecture_placement(lectureId: "xyz")

User: "Who can cover for Prof. Johnson's Physics class?"
→ Calls: find_substitute_teacher(subjectName: "Physics", slotId: "abc")

User: "Which room should we use for this lecture?"
→ Calls: recommend_classroom(lectureId: "xyz")

User: "Is anyone working too much?"
→ Calls: analyze_teacher_workload()

User: "Give me suggestions to improve the schedule"
→ Calls: suggest_optimization(optimizationGoal: "balance_workload")
```

## Security & Access Control

### Multi-Tenancy
- All functions receive `organizationId` in context
- Database queries automatically filter by organization
- Timetable ownership verified before function execution

### Authentication
- Functions only callable through authenticated tRPC endpoint
- Context includes verified user session
- No direct API access to functions

### Data Safety
- **Read-only operations**: No write/delete capabilities
- All mutations must go through standard CRUD endpoints
- Functions cannot modify timetable data

## Performance Considerations

### Optimization Strategies
1. **Selective Field Loading**: Only fetch required fields
2. **Efficient Queries**: Use Prisma includes strategically
3. **Caching Potential**: Results can be cached by timetableId
4. **Pagination**: Not yet implemented but recommended for large datasets

### Query Complexity
- Most queries: 1-3 database calls
- Complex functions (statistics, optimization): Up to 10 calls
- All queries use indexed fields for performance

## Error Handling

### Function-Level Errors
```typescript
try {
  const result = await functionImplementation(args, context);
  return JSON.stringify(result);
} catch (error) {
  // Error logged and thrown
  // Gemini receives error message
  // AI can explain error to user naturally
}
```

### Common Error Types
1. **Not Found**: Entity doesn't exist
2. **Access Denied**: Timetable not in organization
3. **Invalid Parameters**: Missing required fields
4. **Database Errors**: Connection or query issues

## Testing

### Manual Testing Checklist

#### Phase 1 Functions
- [ ] List teachers (with and without filters)
- [ ] Get schedule for teacher/classroom/subdivision
- [ ] Find available slots (single and consecutive)
- [ ] Check conflicts (all scopes)
- [ ] Get statistics

#### Phase 3 Functions
- [ ] Suggest lecture placement with various parameters
- [ ] Find substitute teachers
- [ ] Recommend classrooms
- [ ] Analyze workload (all and specific)
- [ ] Get optimization suggestions

### Test Queries
See `test-queries.md` for comprehensive test scenarios (create this file as needed).

## Future Enhancements

### Potential Phase 2 Features (Not Implemented)
- Smart lecture creation with AI assistance
- Bulk operations (create multiple lectures)
- Schedule swapping and moving
- Availability management
- Lock/unlock lecture slots

### Advanced Analytics
- Historical trend analysis
- Predictive scheduling
- What-if scenarios
- Capacity planning
- Resource forecasting

### Performance Improvements
- Response caching
- Pagination for large result sets
- Aggregation optimizations
- Real-time updates

## Troubleshooting

### Common Issues

**Issue**: Function not being called
- Check function definition in `functions.ts`
- Verify function name matches implementation
- Check Gemini logs for function call attempts

**Issue**: Context errors
- Ensure `timetableId` is valid
- Verify user has access to timetable
- Check `organizationId` matches

**Issue**: Slow responses
- Check database query efficiency
- Consider adding indexes
- Review included relations

**Issue**: Incorrect results
- Verify filter logic
- Check entity name matching (case-insensitive)
- Review scoring algorithms

## Monitoring & Logging

### Key Metrics to Track
- Function call frequency
- Average response time per function
- Error rates
- User satisfaction (feedback)
- Cache hit rates (if implemented)

### Log Locations
- Function execution: Console logs with `[Functions]` prefix
- Gemini API calls: Console logs with `[Gemini Client]` prefix
- Router level: Console logs with `[Chatbot]` prefix

## Contributing

### Adding New Functions

1. **Define in `functions.ts`**:
```typescript
export const myNewFunction = {
  name: "my_new_function",
  description: "What it does",
  parameters: { /* Gemini schema */ },
};
```

2. **Implement in `implementations/`**:
```typescript
export async function myNewFunction(
  prisma: PrismaClient,
  args: { /* typed args */ }
) {
  // Implementation
  return result;
}
```

3. **Wire up in `functionImplementations`**:
```typescript
my_new_function: async (args, context) => {
  const result = await myNewFunction(context.prisma, {
    timetableId: context.timetableId,
    organizationId: context.organizationId,
    ...args,
  });
  return JSON.stringify(result, null, 2);
},
```

4. **Add to `availableFunctions` array**

5. **Test thoroughly**

---

## Summary

The chatbot now has **10 powerful read-only functions** that provide:
- Complete timetable visibility
- Intelligent scheduling recommendations  
- Workload analysis and optimization
- Conflict detection and resolution guidance
- Natural language interface to complex data

All functions are secure, multi-tenant aware, and provide structured JSON responses that Gemini transforms into natural, conversational answers.