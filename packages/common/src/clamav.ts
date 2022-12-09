type ISuccessfulResponse = {
  data: {
    infected: boolean;
    name: string;
    viruses: string[];
  };
  success: true;
};

export type ISuccessfulInfectedResponse = {
	data: {
	  infected: true;
	  name: string;
	  viruses: string[];
	};
	id: string;
	success: true;
};
  

type IErrorResponse = {
  error: string;
  success: false;
};

// eslint-disable-next-line @typescript-eslint/sort-type-union-intersection-members
export type IClamAVResponse = (IErrorResponse | ISuccessfulResponse) & { id: string };
