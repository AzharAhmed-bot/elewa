import
{
  MessageTypes,
  MetaMessagingProducts,
  RecepientType,
  WhatsAppAudioMessage,
  WhatsAppDocumentMessage,
  WhatsAppImageMessage,
  WhatsAppLocationMessage,
  WhatsAppMessageType,
  WhatsAppTextMessage,
  WhatsAppVideoMessage,
} from '@app/model/convs-mgr/functions';

import { 
  AudioMessage, 
  DocumentMessage, 
  FileMessage, 
  ImageMessage, 
  LocationMessage, 
  Message, 
  OutgoingMessagePayload, 
  TemplateMessage, 
  TextMessage, 
  VideoMessage 
} from '@app/model/convs-mgr/conversations/messages';
import { WhatsappTemplateMessageParser } from './standardized-message-to-message-template.parser';

/**
 * Interprets our standardized messages @see {Message} to a whatsapp message
 * 
 * @param {Message} - The standardized message format to be converted to whatsapp message
 * @param {phone} - Thep phone number of the end user
 * 
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 */
export class StandardMessageOutgoingMessageParser
{
  /**
   * @Description Used to send message of type text to whatsapp api
   */
  private _getTextMessageParserOut(message: TextMessage, phone: string): any
  {

    // Create the text payload which will be sent to api
    const textPayload = {
      type: WhatsAppMessageType.TEXT,
      text: {
        preview_url: false,
        body: message.text,
      },
    } as WhatsAppTextMessage;

    const generatedMessage: WhatsAppTextMessage = {
      messaging_product: MetaMessagingProducts.WHATSAPP,
      recepient_type: RecepientType.INDIVIDUAL,
      to: phone,
      ...textPayload
    };

    return generatedMessage;
  }

  /**
   * @Description Used to interpret standard template messages into a format 
   *  whatsapp can understand
   * 
   * @see WhatsappTemplateMessageParser
   */
  private _getTemplateMessageParserOut(message: TemplateMessage, phone: string): any
  {
    // Creates the template payload depending on the type of template
    //   which will be sent to api
    return new WhatsappTemplateMessageParser().parse(message, phone)
  }

  private _getImageMessageParserOut(message: ImageMessage, phone: string)
  {

    // Create the image payload which will be sent to api
    const mediaMessage = {
      type: WhatsAppMessageType.IMAGE,
      image: {
        link: message.url,
      },
    } as WhatsAppImageMessage;

    /**
     * Add the required fields for the whatsapp api
     * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
     */
    const generatedMessage: WhatsAppImageMessage = {
      messaging_product: MetaMessagingProducts.WHATSAPP,
      recepient_type: RecepientType.INDIVIDUAL,
      to: phone,
      type: WhatsAppMessageType.IMAGE,
      ...mediaMessage,
    };
    return generatedMessage;
  }

  private _getLocationMessageParserOut(message: LocationMessage, phone: string)
  {

    // Create the image payload which will be sent to api
    const locationMessage = {
      type: WhatsAppMessageType.LOCATION,
      location: message.location,
    } as WhatsAppLocationMessage;

    /**
     * Add the required fields for the whatsapp api
     * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
     */
    const generatedMessage: WhatsAppLocationMessage = {
      messaging_product: MetaMessagingProducts.WHATSAPP,
      recepient_type: RecepientType.INDIVIDUAL,
      to: phone,
      type: WhatsAppMessageType.LOCATION,
      ...locationMessage,
    };
    return generatedMessage;
  }

  private _getAudioMessageParserOut(message: AudioMessage, phone: string)
  {

    // Create the image payload which will be sent to api
    const audioMessage = {
      type: WhatsAppMessageType.AUDIO,
      audio: {
        link: message.url
      },
    } as WhatsAppAudioMessage;

    /**
     * Add the required fields for the whatsapp api
     * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
     */
    const generatedMessage: WhatsAppAudioMessage = {
      messaging_product: MetaMessagingProducts.WHATSAPP,
      recepient_type: RecepientType.INDIVIDUAL,
      to: phone,
      type: WhatsAppMessageType.AUDIO,
      ...audioMessage,
    };
    return generatedMessage;
  }

  private _getVideoMessageParserOut(message: VideoMessage, phone: string)
  {

    // Create the image payload which will be sent to api
    const videoMessage = {
      type: WhatsAppMessageType.VIDEO,
      video: {
        link: message.url
      },
    } as WhatsAppVideoMessage;

    /**
     * Add the required fields for the whatsapp api
     * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
     */
    const generatedMessage: WhatsAppVideoMessage = {
      messaging_product: MetaMessagingProducts.WHATSAPP,
      recepient_type: RecepientType.INDIVIDUAL,
      to: phone,
      type: WhatsAppMessageType.VIDEO,
      ...videoMessage,
    };
    return generatedMessage;
  }

  _getDocumentMessageParserOut(message: DocumentMessage, phone: string)
  {
    
    // Create the text payload which will be sent to api
    const documentMessage = {
      type: WhatsAppMessageType.DOCUMENT,
      document: {
        filename: message.documentName || "Document",
        link: message.url,
      },
    } as WhatsAppDocumentMessage;

    /**
     * Add the required fields for the whatsapp api
     * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
     */
    const generatedMessage: WhatsAppDocumentMessage = {
      messaging_product: MetaMessagingProducts.WHATSAPP,
      recepient_type: RecepientType.INDIVIDUAL,
      to: phone,
      type: WhatsAppMessageType.DOCUMENT,
      ...documentMessage,
    };
    return generatedMessage;
  }

  parse(message: Message, phone: string): OutgoingMessagePayload
  {
    let parser!: (message: Message, phone: string) => OutgoingMessagePayload;

    switch (message.type) {
      case MessageTypes.TEXT:                     parser = this._getTextMessageParserOut; break;
      case MessageTypes.AUDIO:                    parser = this._getAudioMessageParserOut; break;
      case MessageTypes.VIDEO:                    parser = this._getVideoMessageParserOut; break;
      case MessageTypes.IMAGE:                    parser = this._getImageMessageParserOut; break;
      case MessageTypes.LOCATION:                 parser = this._getLocationMessageParserOut; break;
      case MessageTypes.DOCUMENT:                 parser = this._getDocumentMessageParserOut; break;
      case MessageTypes.TEMPLATE:                 parser = this._getTemplateMessageParserOut; break;
      default:
        parser = this._getTextMessageParserOut;
    }

    return parser(message, phone);
  }
}
