// import { Component, OnDestroy, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { MatDialog } from '@angular/material/dialog'

// import { SubSink } from 'subsink';

// import { combineLatest, concatMap, filter, map } from 'rxjs';

// import { __DECODE_AES, __ENCODE_AES } from '@app/elements/base/security-config';

// import { ActiveStoryStore, StoriesStore } from '@app/state/convs-mgr/stories';
// import { ActiveOrgStore } from '@app/private/state/organisation/main';
// import { FileStorageService } from '@app/state/file';

// import { WhatsAppCommunicationChannel } from '@app/model/convs-mgr/conversations/admin/system';
// import { CommunicationChannel, PlatformType } from '@app/model/convs-mgr/conversations/admin/system';
// import { TelegramCommunicationChannel } from '@app/model/convs-mgr/conversations/admin/system';
// import { Story } from '@app/model/convs-mgr/stories/main';

// import { ManageChannelStoryLinkService } from '../../providers/manage-channel-story-link.service';


// @Component({
//   selector: 'conv-add-bot-to-channel',
//   templateUrl: 'add-bot-to-channel.modal.html',
//   styleUrls: ['./add-bot-to-channel.modal.scss'],
// })

// /**
//  * @Description Form to register bot/story to particular channel e.g WhatsApp/Telegram
//  * Component is meant to allow users to register bot to multiple channels/PlatformType
//  *
//  * TODO:
//  *  - Support multiple channel interfaces. Such that the form fields adjust according to the
//  *  - Properly increment 'n'
//  *  - Redesign form to be a multistep form, which three steps.
//  *      e.g. 1. Choose platform, 2. Enter information (platform specific fields) i.e. business account id 3. Choose language and publish
//  *  - On platform specific fields, it will be nice to have a question mark(?) icon next to it that links to the official documentation
//  */

// export class AddBotToChannelModal implements OnInit, OnDestroy {

//   private _sBs = new SubSink();
//   private _activeStory: Story;
//   private _orgId: string;

//   addToChannelForm: FormGroup;

//   channels: CommunicationChannel[] = [
//     { type: PlatformType.WhatsApp } as WhatsAppCommunicationChannel,
//     { type: PlatformType.Telegram } as TelegramCommunicationChannel
//   ];

//   languages: string[];

//   isSaving: boolean;
//   isLinear = true;

//   constructor(private _fb: FormBuilder,
//     private _dialog: MatDialog,
//     private _manageStoryLinkService: ManageChannelStoryLinkService,
//     private _activeStoryStore$$: ActiveStoryStore,
//     private _activeOrgStore$$: ActiveOrgStore,
//     private _storyStore: StoriesStore,
//     private _fileStorageService: FileStorageService,
//     ) {
//     this.addToChannelForm = this._fb.group({
//       channel: this.channels,
//       businessPhoneNumberId: [null, [Validators.required]],
//       channelName: [null, Validators.required],
//       authenticationKey: [null, Validators.required],
//       messageTemplate: [null],
//       templateVariables: [null]
//     })
//   }

//   ngOnInit() {
//     this._sBs.sink =
//       combineLatest([this._activeStoryStore$$.get(), this._activeOrgStore$$.get()])
//         .pipe(filter(([story, org]) => !!story && !!org))
//         .subscribe(([activeStory, activeOrg]) => {
//           this._activeStory = activeStory
//           this._orgId = activeOrg.id as string;
//         });
//   }

//   onSubmit() {

//     this.isSaving = true;
//     const phoneNumberId = this.addToChannelForm.get('businessPhoneNumberId')?.value;
//     let authKey = this.addToChannelForm.get('authenticationKey')?.value;
//     const businessName = this.addToChannelForm.get('channelName')?.value;

//     authKey = __ENCODE_AES(authKey);

//     const channelToSubmit = {
//       id: phoneNumberId,
//       name: businessName,
//       orgId: this._orgId,
//       defaultStory: this._activeStory.id,
//       n: 1,
//       accessToken: authKey,
//       type: PlatformType.WhatsApp
//     } as WhatsAppCommunicationChannel;

//     // TODO: @CHESA =======> Add cipher for channel authKey so that we can store auth key in db

//     const _storyExistsInChannel$ = this._storyExistsInChannel(channelToSubmit);

//     this._sBs.sink = _storyExistsInChannel$.pipe(map((exists) => {
//       if (!exists) {
//         //If it does not exist, link it to the channel
//         return this._manageStoryLinkService
//           .addStoryToChannel(channelToSubmit).subscribe();
//       } else {
//         return;
//       }
//     })).subscribe(() => {
//       // Publish the story with updated publishedOn date
//       this._storyStore.publish(this._activeStory)
//               .pipe(concatMap(()=> this._fileStorageService.uploadMediaToPlatform(channelToSubmit)))
//                   .subscribe();

//       this.isSaving = false;
//       this.closeDialog();
//     });
//   }

//   private _storyExistsInChannel(channel: CommunicationChannel) {
//     return this._manageStoryLinkService.getSingleStoryInChannel(channel).pipe(map(channels => !!channels.length));
//   }

//   closeDialog = () => this._dialog.closeAll();

//   ngOnDestroy(): void {
//     this._sBs.unsubscribe();
//   }
// }
