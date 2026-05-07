export interface Committee {
  id?: number;
  committeeName: string;
  facultyInchargeName?: string;
  facultyPosition?: string;
  committeeInfo?: string;
  loginId?: number;
  headId?: number;
}

export interface CommitteeMembership {
  membershipId?: number;
  userId: number;
  committeeId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt?: string;
  approvedAt?: string | null;
  approvedBy?: any | null;
  roleInCommittee?: string;
  applicationMessage?: string;
  updatedAt?: string;
  user?: any;
}

export interface CreateCommitteeRequest {
  committeeName: string;
  facultyInchargeName?: string;
  facultyPosition?: string;
  committeeInfo?: string;
}

export interface UpdateCommitteeRequest {
  committeeName: string;
  facultyInchargeName?: string;
  facultyPosition?: string;
  committeeInfo?: string;
}
