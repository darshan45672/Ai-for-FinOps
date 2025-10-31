#!/bin/bash

# Test Mistral tool calling directly
curl http://localhost:11434/api/chat -d '{
  "model": "mistral:latest",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful Azure assistant. When users ask about Azure resources, you MUST use the available tools to fetch real data."
    },
    {
      "role": "user",
      "content": "How many resource groups do I have?"
    }
  ],
  "stream": false,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_resource_groups_count",
        "description": "Get the total count of distinct resource groups across all Azure subscriptions",
        "parameters": {
          "type": "object",
          "properties": {}
        }
      }
    }
  ]
}' | jq '.'
