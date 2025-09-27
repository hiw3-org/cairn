import React from "react";
import { ReproducibilityStatus } from "../../lib/types";
import { CheckCircleIcon, ClockIcon, FlagIcon } from "./icons";
import { Tooltip } from "./tooltip";

export const ReproducibilityBadge = ({
  status,
}: {
  status: ReproducibilityStatus;
}) => {
  const config = {
    Verified: {
      icon: CheckCircleIcon,
      color: "text-status-success",
      text: "Verified Reproducible",
      tooltip: "Independently reproduced by evaluators; logs recorded.",
    },
    Pending: {
      icon: ClockIcon,
      color: "text-status-warning",
      text: "Pending Evaluation",
      tooltip: "Queued for evaluation.",
    },
    Failed: {
      icon: FlagIcon,
      color: "text-status-danger",
      text: "Failed Verification",
      tooltip: "Evaluation did not match reported results.",
    },
  };
  const { icon: Icon, color, text, tooltip } = config[status];

  return (
    <Tooltip text={tooltip}>
      <div
        className={`inline-flex items-center space-x-1.5 font-medium ${color}`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm">{text}</span>
      </div>
    </Tooltip>
  );
};
