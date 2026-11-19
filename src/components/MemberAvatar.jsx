function MemberAvatar({member})
{
    const avatar = member.avatar || member.name.charAt(0).toUpperCase();

    return(
        <span className='member-avatar' style={{backgroundColor: member.color}} 
            title={member.name} aria-label={member.name}> {avatar} </span>
    );
}

export default MemberAvatar;
