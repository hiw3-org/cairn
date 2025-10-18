const { ethers } = require("ethers");

/**
 * Storage Cost Calculator
 * Calculates Filecoin storage costs using Synapse SDK pricing
 */

class StorageCostCalculator {
  /**
   * Calculates storage cost for given data size and duration
   * @param {number} dataSizeBytes - Size of data in bytes
   * @param {number} daysOfStorage - Number of days to store
   * @param {Object} pricing - Pricing info from Synapse SDK
   * @returns {Object} Cost breakdown
   */
  static calculateCost(dataSizeBytes, daysOfStorage, pricing) {
    if (dataSizeBytes <= 0) {
      throw new Error("Data size must be greater than 0 bytes");
    }
    if (daysOfStorage <= 0) {
      throw new Error("Storage duration must be greater than 0 days");
    }

    // Convert bytes to TiB (as used by Synapse)
    // 1 TiB = 1024^4 bytes = 1099511627776 bytes
    const dataSizeTiB =
      (BigInt(dataSizeBytes) * BigInt(1e18)) / BigInt(1024 ** 4);

    // Cost per day in wei
    const perDay =
      (pricing.perTiBPerDay * dataSizeTiB) / BigInt(1e18);

    // Total cost for storage period
    const totalCost = perDay * BigInt(daysOfStorage);

    // Add 20% buffer for safety
    const costWithBuffer = (totalCost * BigInt(120)) / BigInt(100);

    // Rate allowance (10 days worth)
    const rateAllowance = perDay * BigInt(10);

    return {
      perDayWei: perDay.toString(),
      perDay: ethers.formatUnits(perDay, 18),
      totalCostWei: totalCost.toString(),
      totalCost: ethers.formatUnits(totalCost, 18),
      costWithBufferWei: costWithBuffer.toString(),
      costWithBuffer: ethers.formatUnits(costWithBuffer, 18),
      rateAllowanceWei: rateAllowance.toString(),
      rateAllowance: ethers.formatUnits(rateAllowance, 18),
      daysOfStorage,
      dataSizeBytes,
      dataSizeMB: (dataSizeBytes / (1024 * 1024)).toFixed(2),
      dataSizeGB: (dataSizeBytes / (1024 * 1024 * 1024)).toFixed(3),
    };
  }

  /**
   * Formats cost estimate for display
   * @param {Object} costBreakdown - Output from calculateCost
   * @returns {string} Formatted cost string
   */
  static formatCostEstimate(costBreakdown) {
    return `Storage Cost Estimate:
- Data Size: ${costBreakdown.dataSizeMB} MB (${costBreakdown.dataSizeGB} GB)
- Duration: ${costBreakdown.daysOfStorage} days
- Cost per day: ${costBreakdown.perDay} USDFC
- Total cost: ${costBreakdown.totalCost} USDFC
- With buffer (20%): ${costBreakdown.costWithBuffer} USDFC`;
  }

  /**
   * Gets pricing tiers for different storage durations
   * @param {number} dataSizeBytes - Size of data in bytes
   * @param {Object} pricing - Pricing info from Synapse SDK
   * @returns {Array} Array of pricing options
   */
  static getPricingTiers(dataSizeBytes, pricing) {
    const durations = [30, 90, 180, 365]; // days

    return durations.map(days => ({
      days,
      label: days === 30 ? '1 Month' :
             days === 90 ? '3 Months' :
             days === 180 ? '6 Months' : '1 Year',
      cost: this.calculateCost(dataSizeBytes, days, pricing),
    }));
  }

  /**
   * Validates if user has sufficient balance for storage
   * @param {string} userBalanceWei - User's USDFC balance in wei
   * @param {string} requiredCostWei - Required cost in wei
   * @returns {Object} Validation result
   */
  static validateSufficientBalance(userBalanceWei, requiredCostWei) {
    const balance = BigInt(userBalanceWei);
    const required = BigInt(requiredCostWei);

    return {
      hasSufficientBalance: balance >= required,
      balance: ethers.formatUnits(balance, 18),
      required: ethers.formatUnits(required, 18),
      shortfall: balance < required ? ethers.formatUnits(required - balance, 18) : '0',
    };
  }
}

module.exports = StorageCostCalculator;
