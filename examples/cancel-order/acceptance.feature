Feature: Cancel an order safely

  @AC-001
  Scenario: Cancel an order before dispatch
    Given the customer owns a paid order that has not been dispatched
    When the customer cancels the order
    Then the order status is cancelled
    And exactly one refund request is stored for that order
    And the customer sees that cancellation was accepted

  @AC-002
  Scenario: Reject cancellation after dispatch
    Given the customer owns an order that has been dispatched
    When the customer cancels the order
    Then cancellation is rejected
    And the order status remains dispatched
    And no refund request is created by this action

  @AC-003
  Scenario: Repeat a successful cancellation
    Given the customer owns a cancelled order with one stored refund request
    When the customer repeats the cancellation
    Then the customer sees that cancellation was accepted
    And the order still has exactly one refund request

  @AC-004
  Scenario: Reject cancellation by another customer
    Given a paid order belongs to a different customer
    When the current customer attempts to cancel the order
    Then access is denied
    And the order remains unchanged
    And no refund request is created by this action
