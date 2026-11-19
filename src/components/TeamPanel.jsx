import { useState, useRef } from 'react';
import MemberAvatar from './MemberAvatar';

function TeamPanel({members, addTeamMember})
{
    const dialogRef = useRef(null);

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
            dialogRef.current?.close();
        } finally {
            setSaving(false);
        }
    }

    return(

        <section className='team-panel'>
            <div className='team-panel-header'>
                <h2>Team Members</h2>
                <button type='button' onClick={() => dialogRef.current?.showModal()}>
                    Add Team Member
                </button>
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

            <dialog ref={dialogRef} className='task-dialog' aria-label='Add team member'>
                <div className = "dialog-header">
                    <h2> Add Team Member </h2>
                    <button type='button' className='dialog-close' onClick={() => dialogRef.current?.close()} aria-label='Close'> x </button>
                </div>

                <form onSubmit={handleSubmit} className='edit-task-form'>
                    <label> 
                        Name
                        <input type='text' value={name} onChange={(event) => setName(event.target.value)}
                            maxLength={40} required/>
                    </label>
                    <label>
                        Avatar
                        <input type='text' value={avatar} onChange={(event) => setAvatar(event.target.value)} maxLength={8}/>
                    </label>
                    <label>
                        Color
                        <input type='color' value={color} onChange={(event) => setColor(event.target.value)}/>
                    </label>

                    {errorMessage && (<p role='alert'>{errorMessage}</p>)}

                    <div className='dialog-actions'>
                        <button type='button' className='secondary-button' onClick={() => dialogRef.current?.close()}> Cancel </button>
                        <button type='submit' disabled={saving}>
                            {saving ? 'Adding...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </dialog>
        </section>
    );
}
export default TeamPanel;