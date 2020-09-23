import { H264Decoder } from 'h264decoder'

export const decode = (nalu) => {
    console.log(nalu)
    let decoder = new H264Decoder()
    decoder.decode(nalu);
    postMessage([decoder.pic,decoder.width,decoder.height])
}
