import { cn } from "@/lib/utils";

function RightPanel({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <main
      className={cn(
        "w-[350px] bg-background relative flex flex-col p-6",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  );
}

export { RightPanel };
