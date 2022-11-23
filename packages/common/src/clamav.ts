type ISuccessfulResponse = {
  data: {
    infected: boolean;
    name: string;
    viruses: string[];
  };
  success: true;
};

type IErrorResponse = {
  error: string;
  success: false;
};

export type IClamAVResponse = IErrorResponse | ISuccessfulResponse;
