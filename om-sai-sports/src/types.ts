export type Category = "School"|"College"|"Club"|"Cricket"|"Football"|"Kabaddi"|"Running"|"Custom";
export type Design = {
  id:string; title:string; category:Category; description:string; imageUrl:string;
  createdAt:string; featured?:boolean; alt?:string;
};
export type Client = { id:string; name:string; logoUrl?:string; since?:string };