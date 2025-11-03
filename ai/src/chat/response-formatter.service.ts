import { Injectable, Logger } from '@nestjs/common';

/**
 * Response Formatting Service
 * 
 * Provides utilities to format Azure resources and data
 * for user-friendly display in chat responses
 */
@Injectable()
export class ResponseFormatterService {
  private readonly logger = new Logger(ResponseFormatterService.name);

  /**
   * Format Azure resource groups into readable list
   */
  formatResourceGroups(resourceGroups: any[]): string {
    if (!resourceGroups || resourceGroups.length === 0) {
      return 'No resource groups found.';
    }

    const count = resourceGroups.length;

    // For small lists (< 20), show all
    if (count < 20) {
      let response = `I found **${count} resource group${count === 1 ? '' : 's'}** in your Azure subscription:\n\n`;
      
      resourceGroups.forEach((rg, index) => {
        response += `${index + 1}. **${rg.name}**\n`;
        response += `   - 📍 Location: ${rg.location || 'Unknown'}\n`;
        if (rg.subscriptionId) {
          response += `   - 📦 Subscription: ${this.formatSubscriptionId(rg.subscriptionId)}\n`;
        }
        response += '\n';
      });

      return response;
    }

    // For medium lists (20-50), group by location
    if (count < 50) {
      let response = `I found **${count} resource groups**. Here's a summary:\n\n`;
      
      // Group by location
      const byLocation = this.groupBy(resourceGroups, 'location');
      
      response += `📍 **By Location:**\n`;
      Object.entries(byLocation)
        .sort(([, a], [, b]) => (b as any[]).length - (a as any[]).length)
        .slice(0, 5)
        .forEach(([location, groups]) => {
          response += `- **${location || 'Unknown'}**: ${(groups as any[]).length} resource groups\n`;
        });
      
      response += '\n💡 Would you like to see specific resource groups by location?\n';
      
      return response;
    }

    // For large lists (50+), provide comprehensive summary
    let response = `I found **${count} resource groups** across your Azure subscriptions. Here's a summary:\n\n`;
    
    // Group by location
    const byLocation = this.groupBy(resourceGroups, 'location');
    response += `📍 **By Location (Top 5):**\n`;
    Object.entries(byLocation)
      .sort(([, a], [, b]) => (b as any[]).length - (a as any[]).length)
      .slice(0, 5)
      .forEach(([location, groups]) => {
        response += `- **${location || 'Unknown'}**: ${(groups as any[]).length} RGs\n`;
      });
    
    response += '\n';
    
    // Identify patterns
    const patterns = this.identifyPatterns(resourceGroups);
    if (patterns.length > 0) {
      response += `🏷️  **Common Naming Patterns:**\n`;
      patterns.slice(0, 5).forEach(pattern => {
        response += `- \`${pattern.pattern}\`: ${pattern.count} resource groups\n`;
      });
      response += '\n';
    }
    
    // Identify managed/system resource groups
    const systemRGs = resourceGroups.filter(rg => 
      rg.name.toLowerCase().includes('azurebackup') ||
      rg.name.toLowerCase().includes('defaultresourcegroup') ||
      rg.name.toLowerCase().includes('networkwatcher') ||
      rg.name.toLowerCase().includes('cloud-shell') ||
      rg.name.toLowerCase().includes('managed')
    );
    
    if (systemRGs.length > 0) {
      response += `⚙️  **System/Managed Resource Groups:** ${systemRGs.length}\n`;
      response += `   (Azure-managed for backups, monitoring, etc.)\n\n`;
    }
    
    response += `💡 **What would you like to do?**\n`;
    response += `- Filter by location (e.g., "Show me East US resource groups")\n`;
    response += `- Search by name pattern (e.g., "Show production resource groups")\n`;
    response += `- Analyze costs by resource group\n`;
    response += `- Clean up unused resource groups\n`;
    
    return response;
  }

  /**
   * Format virtual machines list
   */
  formatVirtualMachines(vms: any[]): string {
    if (!vms || vms.length === 0) {
      return 'No virtual machines found.';
    }

    let response = `I found **${vms.length} virtual machine${vms.length === 1 ? '' : 's'}**:\n\n`;

    if (vms.length <= 10) {
      // Show detailed list
      response += '| Name | Size | Status | Location | OS |\n';
      response += '|------|------|--------|----------|----|\n';
      
      vms.forEach(vm => {
        response += `| ${vm.name} | ${vm.size || 'N/A'} | ${this.formatStatus(vm.status)} | ${vm.location} | ${vm.osType || 'N/A'} |\n`;
      });
    } else {
      // Show summary
      const byStatus = this.groupBy(vms, 'status');
      response += '📊 **Status Summary:**\n';
      Object.entries(byStatus).forEach(([status, machines]) => {
        response += `- ${this.formatStatus(status)}: ${(machines as any[]).length} VMs\n`;
      });
      
      response += '\n💡 Use filters to see specific VMs:\n';
      response += '- "Show running VMs"\n';
      response += '- "List stopped VMs in East US"\n';
    }

    return response;
  }

  /**
   * Format cost data
   */
  formatCosts(costData: any): string {
    if (!costData) {
      return 'No cost data available.';
    }

    let response = '💰 **Cost Summary**\n\n';
    
    if (costData.total) {
      response += `**Total Spend:** $${costData.total.toFixed(2)}\n`;
    }
    
    if (costData.period) {
      response += `**Period:** ${costData.period}\n`;
    }
    
    if (costData.average) {
      response += `**Daily Average:** $${costData.average.toFixed(2)}\n`;
    }
    
    if (costData.trend) {
      const trendIcon = costData.trend > 0 ? '↗️' : costData.trend < 0 ? '↘️' : '➡️';
      response += `**Trend:** ${trendIcon} ${Math.abs(costData.trend).toFixed(0)}% vs previous period\n`;
    }
    
    response += '\n';
    
    if (costData.byService && costData.byService.length > 0) {
      response += '**Top Services:**\n';
      costData.byService.slice(0, 5).forEach((service: any, index: number) => {
        const percentage = ((service.cost / costData.total) * 100).toFixed(0);
        response += `${index + 1}. **${service.name}**: $${service.cost.toFixed(2)} (${percentage}%)\n`;
      });
    }
    
    return response;
  }

  /**
   * Format recommendations
   */
  formatRecommendations(recommendations: any[]): string {
    if (!recommendations || recommendations.length === 0) {
      return 'No recommendations available at this time.';
    }

    let response = '💡 **Cost Optimization Recommendations**\n\n';
    
    const totalSavings = recommendations.reduce((sum, rec) => sum + (rec.estimatedSavings || 0), 0);
    response += `**Potential Monthly Savings:** $${totalSavings.toFixed(2)}\n\n`;
    
    recommendations.forEach((rec, index) => {
      response += `### ${index + 1}. ${rec.title}\n\n`;
      response += `**Impact:** ${rec.impact || 'Medium'}\n`;
      response += `**Savings:** $${(rec.estimatedSavings || 0).toFixed(2)}/month\n`;
      response += `**Description:** ${rec.description}\n\n`;
      
      if (rec.action) {
        response += `**Action:** ${rec.action}\n\n`;
      }
    });
    
    return response;
  }

  /**
   * Helper: Group array by property
   */
  private groupBy(array: any[], property: string): Record<string, any[]> {
    return array.reduce((groups, item) => {
      const key = item[property] || 'Unknown';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Helper: Identify common naming patterns
   */
  private identifyPatterns(resourceGroups: any[]): Array<{ pattern: string; count: number }> {
    const patterns: Record<string, number> = {};
    
    resourceGroups.forEach(rg => {
      const name = rg.name || '';
      
      // Extract prefix (before first dash or underscore)
      const match = name.match(/^([^-_]+)/);
      if (match) {
        const prefix = match[1];
        patterns[prefix] = (patterns[prefix] || 0) + 1;
      }
    });
    
    return Object.entries(patterns)
      .map(([pattern, count]) => ({ pattern, count }))
      .filter(p => p.count > 1)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Helper: Format subscription ID
   */
  private formatSubscriptionId(subId: string): string {
    if (!subId) return 'Unknown';
    
    // Shorten long subscription IDs
    if (subId.length > 20) {
      return `${subId.substring(0, 8)}...${subId.substring(subId.length - 4)}`;
    }
    
    return subId;
  }

  /**
   * Helper: Format status with emoji
   */
  private formatStatus(status: string): string {
    if (!status) return '❓ Unknown';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('running') || statusLower.includes('active')) {
      return `🟢 ${status}`;
    }
    if (statusLower.includes('stopped') || statusLower.includes('deallocated')) {
      return `🔴 ${status}`;
    }
    if (statusLower.includes('starting') || statusLower.includes('creating')) {
      return `🟡 ${status}`;
    }
    if (statusLower.includes('failed') || statusLower.includes('error')) {
      return `❌ ${status}`;
    }
    
    return `⚪ ${status}`;
  }

  /**
   * Format Azure resource list (generic)
   */
  formatResourceList(resources: any[], resourceType: string): string {
    if (!resources || resources.length === 0) {
      return `No ${resourceType} found.`;
    }

    const count = resources.length;
    let response = `I found **${count} ${resourceType}${count === 1 ? '' : 's'}**:\n\n`;

    if (count <= 15) {
      // Show detailed list
      resources.forEach((resource, index) => {
        response += `${index + 1}. **${resource.name}**\n`;
        if (resource.location) response += `   - 📍 ${resource.location}\n`;
        if (resource.resourceGroup) response += `   - 📦 RG: ${resource.resourceGroup}\n`;
        if (resource.status) response += `   - Status: ${this.formatStatus(resource.status)}\n`;
        response += '\n';
      });
    } else {
      // Show summary
      const byLocation = this.groupBy(resources, 'location');
      response += '📍 **By Location:**\n';
      Object.entries(byLocation).forEach(([location, items]) => {
        response += `- **${location || 'Unknown'}**: ${(items as any[]).length} resources\n`;
      });
      
      response += '\n💡 Ask for specific filters to see detailed information.\n';
    }

    return response;
  }
}
