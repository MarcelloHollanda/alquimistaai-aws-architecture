# Implementation Plan - Nigredo Prospecting Core

## Task List

- [x] 1. Set up database schema and migrations




  - Create migration file `database/migrations/007_create_nigredo_schema.sql`
  - Define tables: `leads`, `form_submissions`, `webhook_logs`, `rate_limits`
  - Add indexes for performance optimization
  - Include constraints for data integrity
  - _Requirements: 1.2, 3.3, 5.1_

- [x] 2. Implement shared utilities and validators



  - [x] 2.1 Create input validation schemas using Zod


    - Define `CreateLeadSchema` with email, phone, message validation
    - Define `ListLeadsQuerySchema` for pagination and filters
    - Export validation functions for reuse
    - _Requirements: 1.3, 5.4_
  

  - [x] 2.2 Create rate limiting utility

    - Implement IP-based rate limit checker
    - Store rate limit data in `rate_limits` table
    - Return clear error messages when limit exceeded
    - _Requirements: 5.3_
  
  - [x] 2.3 Create webhook sender utility


    - Implement HTTP client with retry logic (3 attempts, exponential backoff)
    - Add timeout handling (5 seconds)
    - Log all webhook attempts to `webhook_logs` table
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 3. Implement Create Lead Lambda function



  - [x] 3.1 Create Lambda handler `lambda/nigredo/create-lead.ts`


    - Parse and validate request body using Zod schema
    - Sanitize all text inputs to prevent XSS
    - Extract IP address and user agent from request
    - _Requirements: 1.1, 1.2, 1.3, 5.4_
  

  - [x] 3.2 Implement rate limiting check




    - Query `rate_limits` table for IP address
    - Check if submission count exceeds limit (10/hour)
    - Return 429 error if limit exceeded
    - _Requirements: 5.3_

  
  - [x] 3.3 Implement database operations



    - Insert lead into `leads` table
    - Insert submission record into `form_submissions` table
    - Use transaction to ensure atomicity

    - _Requirements: 1.2, 3.3_
  
  - [x] 3.4 Integrate webhook sender




    - Invoke webhook sender utility with lead data
    - Handle webhook failures gracefully

    - Return success response to client
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 3.5 Add structured logging and tracing




    - Log all operations with correlation IDs
    - Add X-Ray segments for database and webhook calls
    - Emit CloudWatch metrics for submissions
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 4. Implement List Leads Lambda function


  - [x] 4.1 Create Lambda handler `lambda/nigredo/list-leads.ts`


    - Parse and validate query parameters
    - Implement pagination logic (page, limit)
    - Build dynamic SQL query with filters
    - _Requirements: 6.2_
  
  - [x] 4.2 Implement authentication check

    - Validate JWT token from Cognito
    - Extract tenant ID from token claims
    - Filter leads by tenant ID
    - _Requirements: 6.4_
  
  - [x] 4.3 Query database with filters

    - Support filters: status, source, date range, search
    - Return paginated results with metadata
    - Handle empty results gracefully
    - _Requirements: 6.2_
  
  - [x] 4.4 Add structured logging

    - Log query parameters and result count
    - Add X-Ray tracing for database queries
    - _Requirements: 7.1, 7.3_

- [x] 5. Implement Get Lead Lambda function



  - [x] 5.1 Create Lambda handler `lambda/nigredo/get-lead.ts`

    - Parse lead ID from path parameter
    - Validate UUID format
    - _Requirements: 6.3_
  
  - [x] 5.2 Implement authentication and authorization

    - Validate JWT token from Cognito
    - Check if user has permission to view lead
    - Return 403 if unauthorized
    - _Requirements: 6.4_
  
  - [x] 5.3 Query lead details and webhook history

    - Fetch lead from `leads` table
    - Fetch webhook logs from `webhook_logs` table
    - Return 404 if lead not found
    - _Requirements: 6.3_
  
  - [x] 5.4 Add structured logging

    - Log lead ID and user ID
    - Add X-Ray tracing
    - _Requirements: 7.1, 7.3_

- [x] 6. Create Nigredo API CDK Stack



  - [x] 6.1 Create stack file `lib/nigredo-api-stack.ts`

    - Define stack props with VPC, database, and KMS key
    - Import shared resources from Fibonacci stack
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [x] 6.2 Define Lambda functions in CDK

    - Create NodejsFunction constructs for all Lambdas
    - Configure runtime (Node.js 20), memory, timeout
    - Set environment variables (DB_SECRET_ARN, FIBONACCI_WEBHOOK_URL)
    - Enable X-Ray tracing
    - _Requirements: 3.1, 7.3_
  
  - [x] 6.3 Configure VPC and security groups

    - Place Lambdas in private isolated subnets
    - Allow Lambda to Aurora security group access
    - Grant Secrets Manager permissions
    - _Requirements: 3.3, 5.1, 5.2_
  
  - [x] 6.4 Create API Gateway HTTP API

    - Define HTTP API with CORS configuration
    - Create routes: POST /api/leads, GET /api/leads, GET /api/leads/{id}
    - Integrate routes with Lambda functions
    - _Requirements: 3.2, 6.1, 6.2, 6.3_
  
  - [x] 6.5 Configure Cognito authorizer

    - Create HttpUserPoolAuthorizer
    - Attach to protected routes (GET endpoints)
    - Leave POST /api/leads public
    - _Requirements: 6.4_
  
  - [x] 6.6 Add CloudWatch alarms

    - Create alarms for error rate > 5%
    - Create alarms for latency > 1000ms
    - Create alarms for webhook failures > 10%
    - Configure SNS notifications
    - _Requirements: 7.4_
  
  - [x] 6.7 Export stack outputs

    - Export API Gateway URL
    - Export Lambda function ARNs
    - _Requirements: 3.4_

- [x] 7. Implement frontend landing page

  - [x] 7.1 Create Next.js page `frontend/src/app/(institutional)/nigredo/page.tsx`
    - Set up page layout with hero section
    - Add value proposition content
    - Include social proof elements
    - _Requirements: 4.1, 8.1, 8.3_
  
  - [x] 7.2 Create lead form component `frontend/src/components/nigredo/lead-form.tsx`
    - Build form with React Hook Form
    - Add fields: name, email, phone, company, message
    - Implement client-side validation with Zod
    - _Requirements: 1.1, 1.3_
  
  - [x] 7.3 Implement form submission logic
    - Call Create Lead API endpoint
    - Handle loading states with spinner
    - Display success message on completion
    - Show error messages with retry option
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 7.4 Add accessibility features
    - Implement ARIA labels for all form fields
    - Support keyboard navigation
    - Add focus indicators
    - Test with screen readers
    - _Requirements: 4.5_
  
  - [x] 7.5 Optimize for performance
    - Implement lazy loading for images
    - Add loading skeletons
    - Optimize bundle size
    - _Requirements: 4.2, 4.3_
  
  - [x] 7.6 Style with TailwindCSS

    - Use shared design system colors and typography
    - Implement responsive design (mobile, tablet, desktop)
    - Match Fibonacci branding
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. Create Nigredo Frontend CDK Stack
  - [x] 8.1 Create stack file `lib/nigredo-frontend-stack.ts`
    - Define stack props with environment config
    - _Requirements: 3.5_
  
  - [x] 8.2 Create S3 bucket for static hosting
    - Configure bucket with encryption (KMS)
    - Block public access (CloudFront only)
    - Enable versioning
    - _Requirements: 3.5, 5.1, 5.2_
  
  - [x] 8.3 Create CloudFront distribution
    - Configure origin as S3 bucket
    - Set up Origin Access Identity
    - Configure cache behaviors
    - Enable compression (gzip, brotli)
    - _Requirements: 3.5, 4.1, 4.4_
  
  - [x] 8.4 Configure WAF Web ACL
    - Attach WAF to CloudFront distribution
    - Configure rate limiting (2000 req/5min)
    - Enable AWS Managed Rules (SQL injection, XSS)
    - _Requirements: 5.3, 5.5_
  
  - [x] 8.5 Add CloudWatch alarms for frontend
    - Monitor CloudFront error rate
    - Monitor cache hit ratio
    - Alert on WAF blocks
    - _Requirements: 7.4_
  
  - [x] 8.6 Export stack outputs

    - Export CloudFront distribution URL
    - Export S3 bucket name
    - _Requirements: 3.5_

- [x] 9. Implement Fibonacci webhook endpoint





  - [x] 9.1 Create Lambda handler `lambda/fibonacci/handle-nigredo-event.ts`










    - Parse webhook payload
    - Validate event signature (HMAC)
    - Extract lead data
    - _Requirements: 2.1_

  
  - [x] 9.2 Store lead in Fibonacci database





    - Insert lead into Fibonacci leads table
    - Map Nigredo fields to Fibonacci schema
    - Handle duplicate leads gracefully

    - _Requirements: 2.1_
  
  - [x] 9.3 Trigger Nigredo agents

    - Publish event to EventBridge

    - Trigger recebimento agent for lead enrichment
    - _Requirements: 2.1_
  
  - [x] 9.4 Add route to Fibonacci API Gateway



    - Create public route POST /public/nigredo-event
    - Integrate with Lambda function
    - No authentication required
    - _Requirements: 2.1_

- [x] 10. Create deployment scripts





  - [x] 10.1 Create backend deployment script `scripts/deploy-nigredo-backend.ps1`


    - Run database migrations
    - Deploy Nigredo API stack with CDK
    - Verify deployment with health checks
    - _Requirements: 3.4_
  
  - [x] 10.2 Create frontend deployment script `scripts/deploy-nigredo-frontend.ps1`


    - Build Next.js application
    - Upload build to S3 bucket
    - Invalidate CloudFront cache
    - Verify deployment
    - _Requirements: 3.5_
  
  - [x] 10.3 Create full deployment script `scripts/deploy-nigredo-full.ps1`


    - Deploy backend first
    - Deploy frontend second
    - Run smoke tests
    - _Requirements: 3.4, 3.5_
-

- [x] 11. Add monitoring and observability




  - [x] 11.1 Create CloudWatch dashboard `lib/dashboards/nigredo-dashboard.ts`


    - Add widgets for lead submissions over time
    - Add widgets for webhook success rate
    - Add widgets for API latency percentiles
    - Add widgets for error rates by endpoint
    - _Requirements: 7.2, 7.5_
  
  - [x] 11.2 Configure CloudWatch Insights queries


    - Create query for top lead sources
    - Create query for conversion funnel
    - Create query for error analysis
    - _Requirements: 7.1, 7.5_
  
  - [x] 11.3 Set up CloudWatch alarms


    - Critical: API error rate > 5%
    - Critical: API latency > 1000ms (p99)
    - Critical: Webhook failure rate > 10%
    - Warning: API latency > 500ms (p95)
    - _Requirements: 7.4_
-

- [x] 12. Create documentation




  - [x] 12.1 Create API documentation `docs/nigredo/API.md`
    - Document all endpoints with examples
    - Include request/response schemas
    - Add authentication instructions
    - _Requirements: 6.1, 6.2, 6.3_

  
  - [x] 12.2 Create deployment guide `docs/nigredo/DEPLOYMENT.md`

    - Document prerequisites
    - Provide step-by-step deployment instructions
    - Include troubleshooting section
    - _Requirements: 3.4, 3.5_
  

  - [x] 12.3 Create operations runbook `docs/nigredo/OPERATIONS.md`


    - Document monitoring procedures
    - Include incident response playbook
    - Add common troubleshooting scenarios
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 13. Write tests
  - [ ]* 13.1 Write unit tests for Lambda functions
    - Test Create Lead Lambda with valid/invalid inputs
    - Test List Leads Lambda with various filters
    - Test Get Lead Lambda with authorization
    - Test webhook sender with retry logic
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 6.2, 6.3_
  
  - [ ]* 13.2 Write integration tests
    - Test end-to-end form submission flow
    - Test webhook delivery to Fibonacci
    - Test database transactions
    - Test rate limiting behavior
    - _Requirements: 1.1, 2.1, 2.2, 5.3_
  
  - [ ]* 13.3 Write frontend component tests
    - Test lead form validation
    - Test form submission success/error states
    - Test accessibility features
    - _Requirements: 1.1, 1.3, 4.5_

- [x] 14. Integration testing and validation





  - [x] 14.1 Deploy to dev environment


    - Run deployment scripts
    - Verify all resources created
    - Check CloudWatch logs
    - _Requirements: 3.4, 3.5_
  
  - [x] 14.2 Test form submission flow

    - Submit test lead through frontend
    - Verify lead stored in database
    - Verify webhook sent to Fibonacci
    - Verify Fibonacci received event
    - _Requirements: 1.1, 1.2, 2.1, 2.2_
  
  - [x] 14.3 Test API endpoints

    - Test Create Lead API with curl/Postman
    - Test List Leads API with authentication
    - Test Get Lead API with authorization
    - Verify error responses
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 14.4 Test rate limiting

    - Submit 11 forms from same IP
    - Verify 11th submission blocked
    - Verify error message returned
    - _Requirements: 5.3_
  
  - [x] 14.5 Test monitoring and alarms

    - Verify CloudWatch metrics being emitted
    - Verify X-Ray traces appearing
    - Trigger alarms by simulating errors
    - Verify SNS notifications sent
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 14.6 Performance testing

    - Run load test with 100 concurrent submissions
    - Verify API latency < 1000ms (p99)
    - Verify no errors under load
    - Check CloudFront cache hit ratio
    - _Requirements: 4.2, 4.3_
  
  - [x] 14.7 Security testing

    - Test XSS prevention with malicious inputs
    - Test SQL injection with crafted payloads
    - Verify WAF blocking malicious requests
    - Test authentication bypass attempts
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 15. Production deployment






  - [x] 15.1 Review and approve deployment plan

    - Verify all tests passing
    - Review security checklist
    - Get stakeholder approval
    - _Requirements: All_
  


  - [x] 15.2 Deploy to production

    - Run production deployment scripts
    - Monitor deployment progress
    - Verify all resources healthy
    - _Requirements: 3.4, 3.5_

  
  - [x] 15.3 Post-deployment validation

    - Run smoke tests on production
    - Verify monitoring dashboards
    - Check CloudWatch alarms configured
    - Test form submission end-to-end
    - _Requirements: All_
  
  - [x] 15.4 Update documentation


    - Document production URLs
    - Update runbooks with production specifics
    - Share access instructions with team
    - _Requirements: All_
