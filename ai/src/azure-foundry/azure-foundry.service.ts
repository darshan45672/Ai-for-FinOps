import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentsClient, ToolUtility, FunctionToolDefinition } from '@azure/ai-agents';
import { DefaultAzureCredential } from '@azure/identity';

export interface AzureFoundryConfig {
  projectEndpoint: string;
  modelDeploymentName: string;
}

@Injectable()
export class AzureFoundryService implements OnModuleInit {
  private readonly logger = new Logger(AzureFoundryService.name);
  private client: AgentsClient;
  private config: AzureFoundryConfig;
  private agentId: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      projectEndpoint: this.configService.get<string>(
        'AZURE_AI_FOUNDRY_PROJECT_ENDPOINT',
        'https://your-project.services.ai.azure.com/api/projects/your-project',
      ),
      modelDeploymentName: this.configService.get<string>(
        'AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT',
        'gpt-4o',
      ),
    };
  }

  async onModuleInit() {
    try {
      this.logger.log(
        `Initializing Azure AI Foundry service with endpoint: ${this.config.projectEndpoint}`,
      );

      // Initialize Azure AI Agents client with Azure credentials
      this.client = new AgentsClient(
        this.config.projectEndpoint,
        new DefaultAzureCredential(),
      );

      this.logger.log('Azure AI Foundry service initialized successfully');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Azure AI Foundry service:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Get or create an agent with function calling tools
   */
  async getOrCreateAgent(
    tools: FunctionToolDefinition[],
    instructions: string,
    agentName = 'azure-finops-agent',
  ) {
    try {
      // Create a new agent with the provided tools
      const agent = await this.client.createAgent(
        this.config.modelDeploymentName,
        {
          name: agentName,
          instructions,
          tools,
        },
      );

      this.agentId = agent.id;
      this.logger.log(`Created Azure AI Foundry agent with ID: ${agent.id}`);

      return agent;
    } catch (error) {
      this.logger.error('Failed to create agent:', error.message);
      throw error;
    }
  }

  /**
   * Delete an agent
   */
  async deleteAgent(agentId: string) {
    try {
      await this.client.deleteAgent(agentId);
      this.logger.log(`Deleted agent with ID: ${agentId}`);
    } catch (error) {
      this.logger.error('Failed to delete agent:', error.message);
    }
  }

  /**
   * Get the Azure AI Agents client
   */
  getClient(): AgentsClient {
    if (!this.client) {
      throw new Error('Azure AI Foundry client not initialized');
    }
    return this.client;
  }

  /**
   * Get the current model deployment name
   */
  getModelDeploymentName(): string {
    return this.config.modelDeploymentName;
  }

  /**
   * Get the current agent ID
   */
  getCurrentAgentId(): string | null {
    return this.agentId;
  }
}
