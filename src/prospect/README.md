# Prospect Module

This module provides endpoints to retrieve customers marked as prospects along with their sentiment analysis data.

## Features

- Get all prospects with sentiment data
- Get a specific prospect by customer ID
- Aggregates customer and sentiment information

## API Endpoints

### GET /prospects
Returns all customers marked as prospects with their sentiment data.

**Response:**
```json
[
  {
    "customerId": "507f1f77bcf86cd799439011",
    "customerName": "John Doe",
    "isProspect": true,
    "prospectDate": "2024-01-15T00:00:00.000Z",
    "sentiment": "positive",
    "confidence": 0.85
  }
]
```

### GET /prospects/:id
Returns a specific prospect by customer ID.

**Parameters:**
- `id`: Customer ID (string)

**Response:**
```json
{
  "customerId": "507f1f77bcf86cd799439011",
  "customerName": "John Doe",
  "isProspect": true,
  "prospectDate": "2024-01-15T00:00:00.000Z",
  "sentiment": "positive",
  "confidence": 0.85
}
```

## Data Structure

The module returns data that combines:
- Customer information from the `customers` collection
- Sentiment analysis from the `customer_sentiments` collection

## Dependencies

- `customers` module - for customer data
- `sentiment` module - for sentiment analysis data
- MongoDB with Mongoose ODM
