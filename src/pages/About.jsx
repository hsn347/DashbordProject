
import {Card, CardHeader, CardBody, Image} from "@heroui/react";
export default function About(){

    return(
        <>
        <div className="h-screen w-full bg-slate-800 rounded-2xl flex items-center justify-center ">
        <Card className=" bg-slate-700 px-3 py-5 rounded-2xl">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
        <p className="text-tiny uppercase font-bold">Daily Mix</p>
        <small className="text-default-500">12 Tracks</small>
        <h4 className="font-bold text-large">Frontend Radio</h4>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        <Image
          alt="Card background"
          className="object-cover rounded-xl"
          src="https://heroui.com/images/hero-card-complete.jpeg"
          width={270}
        />
      </CardBody>
    </Card>
        </div>
        
        </>
    )
}