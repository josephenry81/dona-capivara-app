import React from 'react';

export default function LoadingCapybara() {
    return (
        <div className="flex flex-col items-center justify-center h-[70vh] w-full bg-[#F5F6FA]">
            <div className="relative">
                {/* Animated Capybara */}
                <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl animate-bounce z-10 relative">
                    <img
                        src="https://scontent.fbfh15-1.fna.fbcdn.net/v/t39.30808-6/553847420_122119716686977479_5765612005474135840_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGYoc5isZ54tqRS9amnP5SCrZ2LrwbPbzetnYuvBs9vN1G5RcQEGZRDdeCL9Q99nvGeMO_CB1dFMf07RkNxEJTE&_nc_ohc=hcHJayRqLZ4Q7kNvwEPwg3T&_nc_oc=AdlpVEklIt7p0ps6yE1IGlHMOcxHdaXJvYQaG3QYos4E_VYesJEuk2vVH1l8uSHny-KqJTyQlfy6VoKp3_kP54OU&_nc_zt=23&_nc_ht=scontent.fbfh15-1.fna&_nc_gid=oFWMehzimRYe6j488AFUpA&oh=00_AfgFXpSoIwMCbAqJFqThZeoRNbaCVMVezlapdk23SbxRmA&oe=6927E03A"
                        alt="Carregando..."
                        className="w-full h-full object-cover rounded-full border-2 border-[#FF9E3D]"
                    />
                </div>
                {/* Shadow ripple effect underneath */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black/10 rounded-[100%] blur-sm animate-pulse"></div>
            </div>

            <h3 className="mt-8 text-lg font-bold text-[#FF4B82] animate-pulse tracking-wide">
                Carregando delícias...
            </h3>
        </div>
    );
}
