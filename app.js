const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock');

let pedido;
let direccion;
let referencia;
let telefono;

const flujoConfirmado = addKeyword ('Verificado')
.addAnswer(`Perfecto, su pedido se empezará a trabajar en unos momentos.`, {media: ''}, async (ctx, {provider}) =>{
    const id = '5217671133935@s.whatsapp.net'
      const buttonMessage = {
        text: `El pedido es el siguiente: ${pedido}`
      }
      const a = await provider.getInstance()

      await a.sendMessage(id, buttonMessage)
      return a

})

const flujoConfirmar = addKeyword('Confirmar pedido')
    .addAnswer(
        'Favor de enviar su ubicación actual, no enviar la ubicación en tiempo real.', {capture:true},

        async (ctx, {flowDynamic}) => {
            direccion = ctx.body
            return flowDynamic('Bien, ahora por favor añada una referencia para identificar su domicilio.')
        }
    )
    .addAnswer(
        'En caso de no haber enviado su ubicación actual, favor de enviar la dirección por texto.', {capture:true},

        async (ctx, {flowDynamic}) => {
            referencia = ctx.body
        }
    )
    .addAnswer(
        'Ahora envíe un número de teléfono para comunicarnos cuando se esté cerca del domicilio.', {capture:true},

        async (ctx, {flowDynamic}) => {
            telefono = ctx.body
            return flowDynamic(`Perfecto, le comparto un resumen de su pedido.
            \n- Pedido: ${pedido}
            \n- Referencia: ${referencia}
            \n- Teléfono: ${telefono}`
            )
        }
    )
    .addAnswer(
        ['Tu pedido es correcto? Al confirmar se enviará al área encargada para trabajarlo y no habrá forma de cancelarlo a menos de que llame directamente al siguiente número: 7671133935'],
        { capture: true, buttons: [
            { body: 'Verificado' },
            { body: 'Volver a pedir' }
        ] },
    )

const flujoMenu = addKeyword(['mostrar menú', 'mostrar menu', 'menu']).addAnswer('Aquí tienes el menú de los Norteños🤠',{
    media:'https://i.postimg.cc/dVjxrnm2/Whats-App-Image-2023-03-13-at-19-02-21.jpg'
})

const flujoPedido = addKeyword(['realizar pedido', 'Volver a pedir'])
    .addAnswer(
        ['Hola!','Envía tu pedido en un solo mensaje'],
        { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }] },

        async (ctx, { flowDynamic, endFlow }) => {
            if (ctx.body == '❌ Cancelar solicitud')
             return endFlow({body: '❌ Su solicitud ha sido cancelada ❌',    // Aquí terminamos el flow si la condicion se comple
                 buttons:[{body:'⬅️ Volver al Inicio' }]                      // Y además, añadimos un botón por si necesitas derivarlo a otro flow

            
            })
            pedido = ctx.body
            return flowDynamic(`Su pedido el siguiente: \n- ${pedido}`)
        }
    )
    .addAnswer(
        ['Tu pedido es correcto?'],
        { capture: true, buttons: [
            { body: 'Confirmar pedido' },
            { body: 'Volver a pedir' }
        ] },
    )
const flujoFormulario = addKeyword(['Hola','⬅️ Volver al Inicio'])
    .addAnswer(
        ['Hola!','Escoja una de las siguientes opciones'],
        { capture: true, buttons: [
            { body: 'Mostrar menú' },
            { body: 'Realizar pedido' },
        ] },
        null, [flujoMenu, flujoPedido]
    )



const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flujoFormulario, flujoPedido, flujoMenu, flujoConfirmar, flujoConfirmado])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()