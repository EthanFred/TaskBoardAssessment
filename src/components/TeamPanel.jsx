import { useState } from 'react';
import MemberAvatar from './MemberAvatar';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '@/components/ui/dialog';

function TeamPanel({members, addTeamMember})
{
    const [dialogOpen, setDialogOpen] = useState(false);

    const[name, setName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [color, setColor] = useState('#64748b');
    const [errorMessage, setErrorMessage] = useState('');
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event)
    {
        event.preventDefault();

        if(!name.trim()) return;

        setSaving(true);
        setErrorMessage('');

        try {
            const success = await addTeamMember(name, avatar, color);

            if(!success)
            {
                setErrorMessage("Unable to add team member");
                return;
            }

            setName('');
            setAvatar('');
            setColor('#64748b');
            setDialogOpen(false);
        } finally {
            setSaving(false);
        }
    }

    return(

        <section className='team-panel'>
            <div className='team-panel-header'>
                <h2>Team Members</h2>
                <Button type='button' className='shadcn-button' onClick={() => setDialogOpen(true)}>
                    Add Team Member
                </Button>
            </div>
            <div className='team-member-list'>
                {members.map((member) => (
                    <div className='team-member' key={member.id}>
                        <MemberAvatar member={member} />
                        <span>{member.name}</span>
                    </div>
                ))}

                {members.length === 0 && (
                    <p>No Team Members Yet</p>
                )}
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">

                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>

                        <DialogDescription>
                            Add someone to your team and customize their avatar.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="board-dialog-form">
                        <label>
                            Name
                            <Input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter a name" maxLength={40} required/>
                        </label>

                        <label>
                            Avatar (Optional)
                            <Input type="text" value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="Enter an emoji" maxLength={8}/>
                        </label>

                        <label>
                            Avatar Color
                            <Input type="color" value={color} onChange={(event) => setColor(event.target.value)}className="h-10 w-20 cursor-pointer p-1"/>
                        </label>

                        {errorMessage && (<p role="alert" className="text-sm text-destructive"> {errorMessage} </p>)}

                        <DialogFooter>
                            <Button type="button" variant="outline" className="shadcn-button" onClick={() => setDialogOpen(false)} disabled={saving}>
                                Cancel
                            </Button>

                            <Button type="submit" className="shadcn-button" disabled={saving}>
                                {saving ? 'Adding...' : 'Add Member'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}
export default TeamPanel;