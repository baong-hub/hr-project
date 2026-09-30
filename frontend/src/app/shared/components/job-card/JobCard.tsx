import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JobCardBase, type JobCardBaseProps } from './JobCardBase';

export interface JobCardProps extends Omit<JobCardBaseProps, 'onClick'> {
  onClick?: () => void;
  /** Custom navigation path if clicking card, defaults to /jobs/:id */
  to?: string;
}

export const JobCard: React.FC<JobCardProps> = ({
  onClick,
  to,
  ...props
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to || `/jobs/${props.job.id}`);
    }
  };

  return <JobCardBase {...props} onClick={handleClick} />;
};

export default JobCard;
