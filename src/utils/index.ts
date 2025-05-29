export const summarizeDamages = (jsonResp: Record<string, any>): string => {
    let summary = "Here is our summary of the damages detected.\n" + jsonResp.itemDamage.overallAssessment + "\n";
    for (const item of jsonResp.itemDamage.damagedParts) {
        summary += item.location + ": " + item.severity + ", " + item.description + "\n";
    }
    summary += "\n" + jsonResp.itemDamage.potentialHiddenIssues.join("\n");
    return summary;
};